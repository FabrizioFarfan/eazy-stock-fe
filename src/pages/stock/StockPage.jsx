import { useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { PackagePlus, SlidersHorizontal, ArrowUpDown, ArrowRight, AlertTriangle, PackageX, Truck } from 'lucide-react'
import PageTitle from '../../components/common/PageTitle'
import HelpDrawer from '../../components/common/HelpDrawer'
import { useAuth } from '../../context/AuthContext'
import { useT } from '../../i18n'
import { useCustomerPaymentsSummary } from '../../hooks/useMoneyMovements'
import MovementModal from './MovementModal'
import SupplierReceiptModal from '../../components/stock/SupplierReceiptModal'
import InventoryTab from '../../components/stock/InventoryTab'
import ReceiptsTab from '../../components/stock/ReceiptsTab'
import MovementsTab from '../../components/stock/MovementsTab'
import { useMovements } from '../../hooks/useStock'
import { useProducts } from '../../hooks/useProducts'
import { useReceipts } from '../../hooks/useReceipts'
import { localISODate } from '../../utils/formatDate'

function firstOfMonthStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

// ── Piezas del diseño (mismo lenguaje que Dashboard y Productos) ─────────────

// Franja azul: lo que se movió HOY en el almacén.
function TodayMovesHero({ total, entries, sales, adjustments, cobros, loading, onSeeAll, onSeeCobros }) {
  const t = useT()
  // Cobros de fiado de hoy (William, 3-oct): la plata que entró sin mover stock, con su atajo
  const cells = [
    [t('Entradas'), entries],
    [t('Ventas'), sales],
    [t('Ajustes'), adjustments],
    [t('Cobros de fiado'), cobros, onSeeCobros],
  ]
  return (
    <div className="relative overflow-hidden rounded-2xl bg-blue-600 p-5 text-white shadow-md shadow-blue-600/30 sm:p-6" data-testid="stock-hero">
      <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-20 right-24 h-40 w-40 rounded-full bg-white/5" />
      <ArrowUpDown className="pointer-events-none absolute right-5 top-5 h-10 w-10 text-white/25 sm:h-12 sm:w-12" />
      <p className="relative text-xs font-semibold uppercase tracking-widest text-white/80">{t('Movimientos de hoy')}</p>
      {loading ? (
        <div className="relative mt-2 h-10 w-24 animate-pulse rounded-lg bg-white/20" />
      ) : (
        <p className="relative mt-1 flex items-baseline gap-2">
          <span className="text-4xl font-extrabold tracking-tight sm:text-5xl">{total ?? 0}</span>
          <span className="text-sm font-medium text-white/80">{t('entradas y salidas de mercadería')}</span>
        </p>
      )}
      <div className="relative mt-5 grid grid-cols-2 gap-2 border-t border-white/20 pt-4 sm:grid-cols-4">
        {cells.map(([label, n, onClick]) => onClick ? (
          <button key={label} type="button" onClick={onClick} className="min-w-0 rounded-lg text-left transition-colors hover:bg-white/10" title={t('Ver los cobros de hoy')}>
            <p className="truncate text-[11px] font-medium uppercase tracking-wide text-white/70">{label} →</p>
            <p className="text-lg font-bold">{loading || n == null ? '—' : n}</p>
          </button>
        ) : (
          <div key={label} className="min-w-0">
            <p className="truncate text-[11px] font-medium uppercase tracking-wide text-white/70">{label}</p>
            <p className="text-lg font-bold">{loading || n == null ? '—' : n}</p>
          </div>
        ))}
      </div>
      <button type="button" onClick={onSeeAll}
        className="relative mt-3 inline-flex items-center gap-1 text-xs font-semibold text-white/90 hover:text-white">
        {t('Ver el historial')} <ArrowRight size={13} />
      </button>
    </div>
  )
}

function ActionTile({ icon: Icon, label, hint, onClick, primary, className = '' }) {
  return (
    <button type="button" onClick={onClick}
      className={`group flex items-center gap-3 rounded-2xl p-4 text-left transition-all active:scale-[0.98] ${
        primary
          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 hover:bg-blue-700'
          : 'border border-gray-100 bg-white shadow-sm hover:border-blue-200 hover:shadow-md'
      } ${className}`}>
      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
        primary ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'}`}>
        <Icon size={19} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-bold ${primary ? 'text-white' : 'text-gray-900'}`}>{label}</p>
        <p className={`truncate text-xs ${primary ? 'text-white/80' : 'text-gray-400'}`}>{hint}</p>
      </div>
      <ArrowRight size={15} className={`hidden flex-shrink-0 transition-transform group-hover:translate-x-0.5 sm:block ${primary ? 'text-white/80' : 'text-gray-300'}`} />
    </button>
  )
}

// Tarjeta con cifra que lleva a su pestaña ya filtrada.
function KpiCard({ icon: Icon, iconCls, label, n, hint, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className="group flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3 text-left shadow-sm transition-shadow hover:shadow-md sm:p-4">
      <div className={`hidden h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl sm:flex ${n ? iconCls : 'bg-gray-100 text-gray-400'}`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-[10px] font-semibold uppercase leading-tight tracking-wide text-gray-400 sm:truncate sm:text-[11px]">{label}</p>
        <p className={`text-2xl font-extrabold ${n ? 'text-gray-900' : 'text-gray-300'}`}>{n ?? '—'}</p>
        {hint && <p className="hidden truncate text-xs text-gray-400 sm:block">{hint}</p>}
      </div>
      <ArrowRight size={14} className="hidden flex-shrink-0 sm:block text-gray-300 transition-transform group-hover:translate-x-0.5" />
    </button>
  )
}

const TABS = [
  { id: 'movements',  label: 'Movimientos' },
  { id: 'inventory',  label: 'Inventario' },
  { id: 'receipts',   label: 'Recepciones' },
]

export default function StockPage() {
  const t = useT()
  const { user }  = useAuth()
  const isManager = user?.role === 'OWNER' || user?.role === 'SUPER_ADMIN'

  // Pestaña y producto filtrado viven en la URL: la ficha del producto trae
  // hasta Movimientos con «?tab=movements&product=<id>» ya filtrado.
  const [searchParams, setSearchParams] = useSearchParams()
  const location  = useLocation()
  const tabParam  = searchParams.get('tab')
  const activeTab = TABS.some((tab) => tab.id === tabParam) ? tabParam : 'movements'
  const productId = searchParams.get('product')
  const typeParam = searchParams.get('type') ?? ''   // ?type=COBRO abre Movimientos ya filtrado
  const [pickedProduct, setPickedProduct] = useState(null)

  const setActiveTab = (id, extra = {}) => setSearchParams(id === 'movements' && Object.keys(extra).length === 0 ? {} : { tab: id, ...extra }, { replace: true })
  const goTo = (id, extra) => {
    setActiveTab(id, extra)
    document.getElementById('stock-tabs')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Cifras de la cabecera: consultas de una fila, solo importa totalElements.
  const biz = user?.role === 'SUPER_ADMIN' && user?.businessId ? { businessId: user.businessId } : {}
  const today = localISODate()
  const day = { from: today, to: today, page: 0, size: 1, ...biz }
  const { data: mAll, isLoading: mLoading } = useMovements(day)
  const { data: mIn }  = useMovements({ ...day, type: 'PURCHASE_ENTRY' })
  const { data: mOut } = useMovements({ ...day, type: 'SALE' })
  const { data: mAdj } = useMovements({ ...day, type: 'ADJUSTMENT' })
  const { data: cobrosToday } = useCustomerPaymentsSummary({ from: today, to: today, ...biz })
  const { data: pLow } = useProducts({ page: 0, size: 1, active: true, lowStock: true, ...biz })
  const { data: pOut } = useProducts({ page: 0, size: 1, active: true, stockMax: 0, ...biz })
  const { data: rMonth } = useReceipts({ page: 0, size: 1, from: firstOfMonthStr(), to: today, ...biz })
  const setProduct = (p) => {
    setPickedProduct(p)
    setSearchParams(p ? { tab: 'movements', product: p.id } : {}, { replace: true })
  }
  const [modal, setModal]               = useState(null) // null | 'ADJUSTMENT'
  const [showReceiptModal, setShowReceiptModal] = useState(false)

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <PageTitle icon={ArrowUpDown} tone="amber">{t('Stock')}</PageTitle>
          <HelpDrawer title={t('Cómo usar la página Stock')} autoOpenKey="eazystock_stock_help_v2">
            <p>
              {t('Esta página tiene 3 pestañas, cada una responde una pregunta distinta:')}
            </p>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">📋 {t('Movimientos')}</p>
              <p className="mt-1">
                {t('El historial completo de todo lo que entró y salió del almacén: ventas, entradas de mercadería, ajustes y devoluciones. Responde "¿qué pasó con mi stock y cuándo?". Si un número no te cuadra, acá está la trazabilidad.')}
              </p>
              <p className="mt-1">
                {t('Cada movimiento lleva su tipo (Entrada, Ajuste, Venta o Devolución) y, entre paréntesis, el stock que quedó del producto justo después. Filtra por Ventas para ver el Resumen de reposición: cuánto vendiste de cada producto, listo para armar tu pedido.')}
              </p>
              <p className="mt-1">
                {t('¿Quieres el historial de UN producto? Búscalo por nombre o código en el primer filtro y elígelo de la lista: verás todos sus movimientos desde que entró a tu catálogo, con los totales de cuánto entró y cuánto se vendió. Con los botones de período (Último mes, Últimos 3 meses…) acotas el tiempo de un toque. También llegas desde la ficha del producto con «Ver todo su historial».')}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">📦 {t('Inventario')}</p>
              <p className="mt-1">
                {t('La foto actual de tus productos: cuánto stock queda de cada uno, su mínimo y su último costo. Responde "¿cuánto tengo hoy?". Haz click en cualquier fila para ver el detalle del producto y desde ahí registrar una entrada o ajustar el stock directamente.')}
              </p>
              <p className="mt-1">
                {t('Debajo de cada nombre ves la unidad de venta (unidad, paquete, kilo, gramo, metro…). La columna Vence muestra el badge de vencimiento y permite filtrar Por vencer (30 días), Vencidos o Con fecha.')}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">🔽 {t('Filtros por columna')}</p>
              <p className="mt-1">
                {t('Cada cabecera del Inventario tiene un embudo estilo Excel: escribe un texto, elige un proveedor o marca, o define un rango de stock o costo. Los filtros activos aparecen como chips arriba de la tabla; quítalos de a uno o con "Limpiar todo".')}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">🚚 {t('Recepciones')}</p>
              <p className="mt-1">
                {t('Las compras de mercadería a tus proveedores. Cada recepción registra qué productos llegaron, a qué costo y cómo se pagó: al contado (no genera deuda) o a crédito (se suma a la cuenta por pagar del proveedor — la ves en Cuentas). Responde "¿qué me llegó y qué le debo a cada proveedor?".')}
              </p>
              <p className="mt-1">
                {t('Busca un producto para ver solo las recepciones donde te llegó.')}{' '}
                {t('Puedes buscar por número de factura/guía y filtrar por modalidad. Las fechas se interpretan en tu zona horaria: si filtras "hoy" verás las recepciones de tu día, no del servidor.')}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">📌 {t('Cabecera fija')}</p>
              <p className="mt-1">
                {t('En todas las tablas la fila de títulos queda fija al hacer scroll, así nunca pierdes de vista qué columna estás leyendo.')}
              </p>
            </div>
            <p className="text-xs text-gray-400">
              {t('Tip: "Registrar recepción" es la forma correcta de ingresar mercadería comprada (actualiza stock, costo y deuda de una vez). "Ajuste" es solo para corregir diferencias del inventario físico.')}
            </p>
          </HelpDrawer>
        </div>
      </div>

      {/* Franja del día + accesos grandes */}
      <div className={`grid grid-cols-1 gap-4 ${isManager ? 'lg:grid-cols-3' : ''}`}>
        <div className={isManager ? 'lg:col-span-2' : ''}>
          <TodayMovesHero loading={mLoading} total={mAll?.totalElements} entries={mIn?.totalElements}
            sales={mOut?.totalElements} adjustments={mAdj?.totalElements} cobros={cobrosToday?.count}
            onSeeAll={() => goTo('movements')} onSeeCobros={() => goTo('movements', { type: 'COBRO' })} />
        </div>
        {isManager && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 lg:content-start">
            <ActionTile icon={PackagePlus} primary label={t('Registrar recepción')} hint={t('Llegó mercadería del proveedor')}
              onClick={() => setShowReceiptModal(true)} />
            <ActionTile icon={SlidersHorizontal} label={t('Ajuste de stock')} hint={t('Corrige lo que no cuadra con el conteo')}
              onClick={() => setModal('ADJUSTMENT')} />
          </div>
        )}
      </div>

      {/* Lo que pide atención, cada tarjeta abre su pestaña ya filtrada */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <KpiCard icon={AlertTriangle} iconCls="bg-red-50 text-red-600" label={t('Stock bajo')} n={pLow?.totalElements}
          hint={t('Por debajo de su mínimo')} onClick={() => goTo('inventory', { low: '1' })} />
        <KpiCard icon={PackageX} iconCls="bg-orange-50 text-orange-600" label={t('Agotados')} n={pOut?.totalElements}
          hint={t('Sin una sola unidad')} onClick={() => goTo('inventory', { out: '1' })} />
        <KpiCard icon={Truck} iconCls="bg-emerald-50 text-emerald-600" label={t('Recepciones este mes')} n={rMonth?.totalElements}
          hint={t('Compras a tus proveedores')} onClick={() => goTo('receipts')} />
      </div>

      {/* Tabs */}
      <div id="stock-tabs" className="flex scroll-mt-4 gap-1 rounded-xl border border-gray-200 bg-gray-100 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t(tab.label)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'inventory' && (
        <InventoryTab key={searchParams.toString()}
          initialLowStock={searchParams.get('low') === '1'}
          initialStockMax={searchParams.get('out') === '1' ? '0' : ''} />
      )}
      {activeTab === 'receipts'  && <ReceiptsTab />}
      {activeTab === 'movements' && (
        <MovementsTab key={typeParam} initialType={typeParam} productId={productId}
          productHint={pickedProduct ?? location.state?.product ?? null}
          onProductChange={setProduct} />
      )}

      {modal && <MovementModal type={modal} onClose={() => setModal(null)} />}
      {showReceiptModal && <SupplierReceiptModal onClose={() => setShowReceiptModal(false)} />}
    </div>
  )
}
