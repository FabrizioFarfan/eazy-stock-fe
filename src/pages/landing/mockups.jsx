import {
  Package, BarChart2, ShoppingCart, ArrowUpDown, Users, Truck,
  Search, Filter, CheckCircle2, CalendarClock, Wallet,
  Smartphone, CreditCard, Banknote, FileText, MessageCircle, Download,
  ScanLine, Percent, Bell, Receipt, Landmark,
} from 'lucide-react'
import { useT } from '../../i18n'

// ═══════════════════════════════════════════════════════════════════════════
//  Mockups de UI en puro CSS/JSX. Las etiquetas se traducen con t(); los datos (productos, nombres) no.
// ═══════════════════════════════════════════════════════════════════════════

function WindowChrome({ url, dark = true }) {
  return (
    <div className={`flex items-center gap-1.5 border-b px-4 py-2.5 ${dark ? 'border-white/5 bg-[#0a0e1a]' : 'border-gray-100 bg-gray-50'}`}>
      <div className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
      <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
      <div className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
      <div className={`ml-3 flex h-5 flex-1 items-center gap-1 rounded px-2 text-[10px] ${dark ? 'bg-white/5 text-slate-500' : 'bg-white text-gray-400 ring-1 ring-gray-100'}`}>
        <span className="text-emerald-400">●</span> {url}
      </div>
    </div>
  )
}

// ── Hero: Productos con vencimiento, unidad de venta, filtros y alertas en vivo

const PRODUCT_ROWS = [
  { sku: 'F2963', name: 'Cemento Sol',             unit: 'bolsa',   stock: 120, exp: null,           price: '$ 27.50' },
  { sku: 'F0412', name: 'Cable THW 14 AWG',        unit: 'metro',   stock: 380, exp: null,           price: '$ 1.90' },
  { sku: 'M0098', name: 'Leche Gloria 400g',       unit: 'unidad',  stock: 46,  exp: { d: 12 },       price: '$ 4.20' },
  { sku: 'F0087', name: 'Pegamento PVC 1/4 gal',   unit: 'unidad',  stock: 3,   exp: null,  low: true, price: '$ 12.50' },
  { sku: 'M0121', name: 'Yogurt frutado 1L',       unit: 'unidad',  stock: 18,  exp: { d: 3 },        price: '$ 6.50' },
  { sku: 'F2201', name: 'Tornillo 1/4" × 2"',      unit: 'paquete', stock: 524, exp: null,           price: '$ 0.0357' },
]

export function AppMockup() {
  const t = useT()
  return (
    <div className="relative w-full max-w-2xl">
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-blue-500/25 via-indigo-500/20 to-amber-400/20 blur-2xl" />

      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0f172a] shadow-2xl shadow-blue-900/40">
        <WindowChrome url="eazy-stock.com/products" />

        <div className="flex">
          {/* Sidebar */}
          <div className="hidden w-40 flex-shrink-0 flex-col gap-1 border-r border-white/5 bg-[#0a0e1a] p-3 sm:flex">
            <div className="mb-2 flex items-center gap-2 px-2 py-1">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-blue-500 to-indigo-600">
                <Package size={11} className="text-white" />
              </div>
              <span className="text-xs font-bold text-white">Eazy Stock</span>
            </div>
            {[
              { icon: BarChart2,    label: 'Dashboard' },
              { icon: Package,      label: 'Productos', active: true, badge: '1,248' },
              { icon: ShoppingCart, label: 'Ventas' },
              { icon: ArrowUpDown,  label: 'Stock' },
              { icon: Users,        label: 'Clientes', badge: '7' },
              { icon: Truck,        label: 'Proveedores' },
              { icon: BarChart2,    label: 'Reportes' },
            ].map(({ icon: Icon, label, active, badge }) => (
              <div key={label} className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-[11px] ${
                active ? 'bg-blue-600 text-white shadow-sm shadow-blue-900/50' : 'text-slate-400'
              }`}>
                <div className="flex items-center gap-2"><Icon size={11} />{label}</div>
                {badge && <span className="rounded bg-white/10 px-1 text-[9px]">{badge}</span>}
              </div>
            ))}
            <div className="mt-auto flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2 py-1.5 text-[9px] font-semibold text-emerald-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> {t('En vivo')}
            </div>
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1 p-3 sm:p-4">
            {/* Toolbar */}
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-7 flex-1 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2 text-[10px] text-slate-500">
                <Search size={11} /> {t('Buscar por nombre, código, barras…')}
              </div>
              <div className="flex h-7 items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2 text-[10px] text-slate-300">
                <Filter size={10} /> {t('Vence')} <span className="rounded bg-amber-500/20 px-1 text-[9px] text-amber-300">{t('30 días')}</span>
              </div>
              <div className="hidden h-7 items-center rounded-lg bg-blue-600 px-2.5 text-[10px] font-bold text-white sm:flex">+ {t('Nuevo')}</div>
            </div>

            {/* Table header (sticky look) */}
            <div className="grid grid-cols-12 gap-1 rounded-t-lg bg-white/[0.05] px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500">
              <span className="col-span-2">{t('Código')}</span>
              <span className="col-span-4">{t('Producto')}</span>
              <span className="col-span-2 hidden sm:block">{t('Unidad')}</span>
              <span className="col-span-2 sm:col-span-1">Stock</span>
              <span className="col-span-4 text-right sm:col-span-3">{t('Vence · Precio')}</span>
            </div>

            {PRODUCT_ROWS.map((row, i) => (
              <div key={row.sku} className="lp-row grid grid-cols-12 items-center gap-1 border-b border-white/5 px-2.5 py-2" style={{ animationDelay: `${200 + i * 110}ms` }}>
                <span className="col-span-2 font-mono text-[9px] text-slate-500">{row.sku}</span>
                <p className="col-span-4 truncate text-[10px] font-medium text-white">{row.name}</p>
                <span className="col-span-2 hidden sm:block">
                  <span className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] text-slate-300">{t(row.unit)}</span>
                </span>
                <span className="col-span-2 sm:col-span-1">
                  <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
                    row.low ? 'bg-red-500/15 text-red-400' : 'bg-emerald-500/15 text-emerald-400'
                  }`}>{row.low ? '↓ ' : ''}{row.stock}</span>
                </span>
                <span className="col-span-4 flex items-center justify-end gap-1.5 text-right sm:col-span-3">
                  {row.exp && (
                    <span className={`inline-flex items-center gap-0.5 whitespace-nowrap rounded-full px-1.5 py-0.5 text-[8px] font-bold ${
                      row.exp.d <= 7 ? 'bg-red-500/15 text-red-300' : 'bg-amber-500/15 text-amber-300'
                    }`}>
                      <CalendarClock size={8} /> {t('vence en {n} días', { n: row.exp.d })}
                    </span>
                  )}
                  <span className="text-[10px] text-slate-300">{row.price}</span>
                </span>
              </div>
            ))}

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-semibold text-amber-300">{t('2 por vencer')}</span>
              <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[9px] font-semibold text-red-300">{t('1 stock bajo')}</span>
              <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[9px] font-semibold text-blue-300">{t('Código sugerido')}: F2964</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating cards */}
      <div className="lp-floaty absolute -bottom-5 -right-3 hidden max-w-[230px] rounded-xl border border-white/10 bg-[#0f172a] p-3 shadow-2xl shadow-black/50 lg:block">
        <div className="flex items-start gap-2">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-amber-500/15">
            <Bell size={13} className="text-amber-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-white">{t('Stock bajo')}</p>
            <p className="mt-0.5 text-[9px] text-slate-400">"Pegamento PVC 1/4 gal" — {t('quedan {n}, mínimo {min}', { n: 3, min: 10 })}</p>
          </div>
        </div>
      </div>
      <div className="lp-floaty-slow absolute -left-6 -top-5 hidden max-w-[220px] rounded-xl border border-emerald-400/20 bg-[#0f172a] p-3 shadow-2xl shadow-black/50 lg:block">
        <div className="flex items-start gap-2">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-500/15">
            <CheckCircle2 size={13} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-white">{t('Venta registrada')}</p>
            <p className="mt-0.5 text-[9px] text-slate-400">$ 45.50 · {t('Billetera digital')} — {t('stock actualizado')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Cierre de caja por medio de pago

const CASH_ROWS = [
  { label: 'Efectivo',      value: 1180.00, pct: 100, icon: Banknote,   color: 'bg-emerald-500' },
  { label: 'Billetera digital', value: 820.00, pct: 69, icon: Smartphone, color: 'bg-violet-500' },
  { label: 'QR',            value: 230.00,  pct: 20,  icon: Smartphone, color: 'bg-sky-500' },
  { label: 'Tarjeta',       value: 200.50,  pct: 17,  icon: CreditCard, color: 'bg-amber-500' },
  { label: 'Transferencia', value: 150.00,  pct: 13,  icon: Landmark,   color: 'bg-blue-500' },
]

export function CashClosingMockup() {
  const t = useT()
  return (
    <div className="relative">
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-emerald-200/50 to-blue-200/40 blur-2xl" />
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <WindowChrome url="eazy-stock.com/reports/balance" dark={false} />
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{t('Cierre de caja')}</p>
              <p className="text-lg font-extrabold text-gray-900">{t('Hoy · viernes 28 ago')}</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-100">{t('{n} ventas', { n: 18 })}</span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { l: 'Total cobrado', v: '$ 2,580.50', c: 'text-gray-900' },
              { l: 'Al fiado',      v: '$ 250.00',   c: 'text-amber-600' },
              { l: 'Devoluciones',  v: '$ 0.00',     c: 'text-gray-500' },
            ].map((s) => (
              <div key={s.l} className="rounded-xl border border-gray-100 bg-gray-50/70 p-2.5">
                <p className="text-[9px] uppercase tracking-wider text-gray-400">{t(s.l)}</p>
                <p className={`mt-0.5 font-mono text-sm font-extrabold ${s.c}`}>{s.v}</p>
              </div>
            ))}
          </div>

          <p className="mb-2 mt-5 text-[10px] font-bold uppercase tracking-widest text-gray-400">{t('Por medio de pago')}</p>
          <div className="space-y-2.5">
            {CASH_ROWS.map((r, i) => (
              <div key={r.label} className="lp-row" style={{ animationDelay: `${i * 90}ms` }}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-semibold text-gray-700"><r.icon size={12} className="text-gray-400" />{t(r.label)}</span>
                  <span className="font-mono font-bold text-gray-900">$ {r.value.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div className={`lp-bar h-full rounded-full ${r.color}`} style={{ width: `${r.pct}%`, animationDelay: `${150 + i * 120}ms` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between rounded-xl bg-[#0a0e1a] px-4 py-3 text-white">
            <span className="text-xs text-slate-300">{t('Lo que debe haber en caja (efectivo)')}</span>
            <span className="font-mono text-base font-extrabold">$ 1,180.00</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Pedido al proveedor (previsual editable → PDF / WhatsApp)

const ORDER_ROWS = [
  { code: 'F0087', name: 'Pegamento PVC 1/4 gal', stock: 3,  min: 10, qty: 24 },
  { code: 'F0301', name: 'Cinta teflón 1/2"',     stock: 5,  min: 20, qty: 50 },
  { code: 'F1120', name: 'Codo PVC 1/2" × 90°',   stock: 12, min: 40, qty: 100 },
  { code: 'F0554', name: 'Lija de agua #120',     stock: 0,  min: 30, qty: 60 },
]

export function SupplierOrderMockup() {
  const t = useT()
  return (
    <div className="relative">
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-blue-200/50 to-indigo-200/40 blur-2xl" />
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <WindowChrome url={`eazy-stock.com/reports · ${t('Stock bajo')}`} dark={false} />
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600">{t('Pedido al proveedor')}</p>
              <p className="text-lg font-extrabold text-gray-900">Distribuidora El Norte S.A.C.</p>
              <p className="text-[11px] text-gray-400">{t('4 productos bajo mínimo · previsual editable')}</p>
            </div>
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><FileText size={16} /></div>
          </div>

          {/* PDF preview */}
          <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="grid grid-cols-12 gap-1 bg-gray-50 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wide text-gray-400">
              <span className="col-span-2">{t('Código')}</span>
              <span className="col-span-5">{t('Producto')}</span>
              <span className="col-span-2 text-right">{t('Stock/Mín')}</span>
              <span className="col-span-3 text-right">{t('Pedir')}</span>
            </div>
            {ORDER_ROWS.map((r, i) => (
              <div key={r.code} className="lp-row grid grid-cols-12 items-center gap-1 border-t border-gray-100 px-3 py-2 text-[11px]" style={{ animationDelay: `${i * 100}ms` }}>
                <span className="col-span-2 font-mono text-gray-400">{r.code}</span>
                <span className="col-span-5 truncate text-gray-800">{r.name}</span>
                <span className="col-span-2 text-right font-mono text-red-500">{r.stock}<span className="text-gray-300">/{r.min}</span></span>
                <span className="col-span-3 flex justify-end">
                  <span className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 font-mono font-bold text-blue-700 ring-2 ring-transparent">
                    {r.qty}
                    {i === 1 && <span className="lp-blink ml-px h-3 w-px bg-blue-600" />}
                  </span>
                </span>
              </div>
            ))}
            <div className="border-t border-dashed border-gray-200 px-3 py-2 text-[10px] italic text-gray-400">
              {t('Nota: entregar antes del sábado, por favor.')}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#25D366] px-3 py-2 text-xs font-bold text-white shadow-sm">
              <MessageCircle size={13} /> {t('Enviar por WhatsApp')}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700">
              <Download size={13} /> {t('Descargar PDF')}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Nueva venta rápida: escaneo, descuento, medios de pago

export function PosMockup() {
  const t = useT()
  return (
    <div className="relative">
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-amber-200/50 to-rose-200/40 blur-2xl" />
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <WindowChrome url="eazy-stock.com/sales/new" dark={false} />
        <div className="grid gap-0 sm:grid-cols-5">
          {/* Scanner */}
          <div className="relative sm:col-span-2 bg-[#0a0e1a] p-4">
            <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400"><ScanLine size={11} /> {t('Escanear')}</p>
            <div className="relative h-32 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-b from-slate-800 to-slate-900">
              <div className="absolute inset-4 rounded-lg border-2 border-dashed border-emerald-400/40" />
              <div className="lp-scanline absolute inset-x-3 h-0.5 bg-emerald-400 shadow-[0_0_12px_2px_rgba(52,211,153,.7)]" />
              <div className="absolute inset-x-0 bottom-2 flex justify-center gap-px">
                {[3,1,2,1,3,2,1,1,2,3,1,2,2,1,3,1,2,1,3,2].map((w, i) => (
                  <span key={i} className="h-6 bg-white/70" style={{ width: w }} />
                ))}
              </div>
            </div>
            <p className="mt-2 text-center text-[9px] text-emerald-400">{t('Cámara del celular · sin lector')}</p>
          </div>

          {/* Cart */}
          <div className="sm:col-span-3 p-4">
            <div className="space-y-2">
              {[
                { n: 'Leche Gloria 400g',     q: '3 × $ 4.20',  t: '$ 12.60' },
                { n: 'Cable THW 14 AWG',      q: '15 m × $ 1.90', t: '$ 28.50' },
                { n: 'Tornillo 1/4" × 2"',    q: t('1 paquete'),   t: '$ 8.90' },
              ].map((it, i) => (
                <div key={it.n} className="lp-row flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2" style={{ animationDelay: `${i * 120}ms` }}>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-gray-800">{it.n}</p>
                    <p className="text-[10px] text-gray-400">{it.q}</p>
                  </div>
                  <span className="font-mono text-xs font-bold text-gray-900">{it.t}</span>
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px]">
              <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 font-semibold text-rose-600"><Percent size={10} /> {t('Descuento')} 10%</span>
              <span className="text-gray-400">Subtotal $ 50.00</span>
            </div>

            <p className="mb-1.5 mt-3 text-[9px] font-bold uppercase tracking-widest text-gray-400">{t('Medio de pago')}</p>
            <div className="flex flex-wrap gap-1.5">
              {['Efectivo', 'Billetera', 'QR', 'Tarjeta', 'Fiado'].map((m, i) => (
                <span key={m} className={`rounded-lg px-2.5 py-1 text-[10px] font-bold ${
                  i === 1 ? 'bg-violet-600 text-white shadow-md shadow-violet-200' : 'border border-gray-200 bg-white text-gray-600'
                }`}>{t(m)}</span>
              ))}
            </div>

            <div className="lp-pop mt-3 flex items-center justify-between rounded-xl bg-emerald-600 px-4 py-2.5 text-white shadow-lg shadow-emerald-200" style={{ animationDelay: '500ms' }}>
              <span className="flex items-center gap-1.5 text-xs font-bold"><Receipt size={13} /> {t('Cobrar')}</span>
              <span className="font-mono text-base font-extrabold">$ 45.00</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Fiado: cliente con deuda, recordatorio WhatsApp y estado de cuenta PDF

export function FiadoMockup() {
  const t = useT()
  return (
    <div className="relative">
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-violet-200/50 to-blue-200/40 blur-2xl" />
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <WindowChrome url="eazy-stock.com/customers/23" dark={false} />
        <div className="bg-gradient-to-br from-violet-50 to-blue-50 p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-violet-600">{t('Cliente')}</p>
              <p className="mt-0.5 text-lg font-extrabold text-gray-900">Rosa Huamán</p>
              <p className="text-[11px] text-gray-500">ID 4•••••12 · +•• 9•• ••• 321</p>
            </div>
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">{t('Debe')}</span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { l: 'Deuda',      v: '$ 580',   c: 'text-amber-600' },
              { l: 'Límite',     v: '$ 1,000', c: 'text-gray-900' },
              { l: 'Disponible', v: '$ 420',   c: 'text-emerald-600' },
            ].map((s) => (
              <div key={s.l} className="rounded-xl border border-white/70 bg-white p-2.5">
                <p className="text-[9px] uppercase tracking-widest text-gray-400">{t(s.l)}</p>
                <p className={`mt-0.5 font-mono text-sm font-extrabold ${s.c}`}>{s.v}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#25D366] px-3 py-1.5 text-[11px] font-bold text-white shadow-sm"><MessageCircle size={12} /> {t('Recordar por WhatsApp')}</span>
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-bold text-gray-700"><FileText size={12} /> {t('Estado de cuenta PDF')}</span>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {[
            { type: 'SALE',    label: 'Venta al fiado',  amount: '+$ 250', date: 'Hoy 14:30',  color: 'text-amber-600' },
            { type: 'PAYMENT', label: 'Pago · Billetera',     amount: '−$ 200', date: 'Ayer',       color: 'text-emerald-600' },
            { type: 'SALE',    label: 'Venta al fiado',  amount: '+$ 530', date: '19 ago',     color: 'text-amber-600' },
          ].map((tr, i) => (
            <div key={i} className="lp-row flex items-center justify-between px-5 py-2.5" style={{ animationDelay: `${i * 110}ms` }}>
              <div className="flex items-center gap-3">
                <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${tr.type === 'SALE' ? 'bg-amber-50' : 'bg-emerald-50'}`}>
                  {tr.type === 'SALE' ? <ShoppingCart size={13} className="text-amber-600" /> : <Wallet size={13} className="text-emerald-600" />}
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900">{t(tr.label)}</p>
                  <p className="text-[10px] text-gray-400">{t(tr.date)}</p>
                </div>
              </div>
              <span className={`font-mono text-sm font-bold ${tr.color}`}>{tr.amount}</span>
            </div>
          ))}
        </div>

        {/* WhatsApp bubble */}
        <div className="border-t border-gray-100 bg-[#efeae2] p-3">
          <div className="lp-pop ml-auto max-w-[85%] rounded-lg rounded-tr-none bg-[#d9fdd3] px-3 py-2 text-[10px] leading-snug text-gray-800 shadow-sm" style={{ animationDelay: '450ms' }}>
            {t('Hola Rosa 👋 te escribimos de')} <b>Ferretería San Martín</b>. {t('Tu cuenta tiene un saldo pendiente de')} <b>$ 580.00</b>. {t('¿Coordinamos el pago? ¡Gracias!')}
            <span className="mt-1 block text-right text-[8px] text-gray-500">14:32 ✓✓</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Import desde Excel con historial

export function ImportMockup() {
  const t = useT()
  return (
    <div className="relative">
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-emerald-200/40 to-blue-200/40 blur-2xl" />
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50/60 px-5 py-3">
          {[
            { num: 1, label: 'Subir', done: true },
            { num: 2, label: 'Mapear', done: true },
            { num: 3, label: 'Revisar', active: true },
            { num: 4, label: 'Importar' },
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-1.5">
              <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                s.done ? 'bg-emerald-500 text-white' : s.active ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>{s.done ? '✓' : s.num}</div>
              <span className={`text-[11px] font-medium ${s.active ? 'text-gray-900' : s.done ? 'text-emerald-700' : 'text-gray-400'}`}>{t(s.label)}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2 border-b border-gray-100 px-5 py-3">
          {[
            { label: 'Filas',    value: 3435, color: 'text-gray-900' },
            { label: 'Listas',   value: 3429, color: 'text-emerald-600' },
            { label: 'Avisos',   value: 742,  color: 'text-amber-600' },
            { label: 'Errores',  value: 0,    color: 'text-red-600' },
          ].map((c) => (
            <div key={c.label} className="rounded-lg border border-gray-100 bg-white p-2 text-center">
              <p className="text-[9px] uppercase tracking-widest text-gray-400">{t(c.label)}</p>
              <p className={`text-base font-extrabold ${c.color}`}>{c.value.toLocaleString('es-PE')}</p>
            </div>
          ))}
        </div>
        <div className="space-y-px">
          {[
            { n: 1, name: 'Abrazadera 1/2" S/Fin',  sku: 'F0003', ok: true,  issue: '—' },
            { n: 2, name: 'Cemento Sol',             sku: 'F0121', ok: true,  issue: 'Vence: 12/2026' },
            { n: 3, name: 'Abasto 1/2" × 1/2"',      sku: 'F0047', ok: false, issue: 'Tildes corregidas (Ã± → ñ)' },
            { n: 4, name: 'Tornillo 1/4" × 2"',      sku: 'F0250', ok: false, issue: 'Precio variable' },
            { n: 5, name: 'Filtro K&N',              sku: 'F0089', ok: false, issue: 'Stock −5 → 0' },
          ].map((r, i) => (
            <div key={r.n} className={`lp-row grid grid-cols-12 gap-2 px-5 py-2 text-[11px] ${r.ok ? 'bg-emerald-50' : 'bg-amber-50'}`} style={{ animationDelay: `${i * 90}ms` }}>
              <span className="col-span-1 font-mono text-gray-400">{r.n}</span>
              <span className="col-span-5 truncate text-gray-900">{r.name}</span>
              <span className="col-span-2 font-mono text-gray-500">{r.sku}</span>
              <span className={`col-span-4 truncate text-right ${r.ok ? 'text-emerald-700' : 'text-amber-700'}`}>{t(r.issue)}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-gray-100 px-5 py-2.5 text-[10px] text-gray-500">
          <span>{t('Historial: 4 importaciones · última hace 2 días')}</span>
          <span className="rounded-md bg-gray-100 px-2 py-0.5 font-semibold text-gray-700">{t('Descargar reporte')}</span>
        </div>
      </div>
    </div>
  )
}

