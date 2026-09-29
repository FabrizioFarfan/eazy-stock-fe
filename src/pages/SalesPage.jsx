import { formatPrice } from '../utils/formatMoney'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ShoppingCart, ChevronLeft, ChevronRight, X, Tag, FileText, UserRound, TrendingDown, TrendingUp, ArrowRight, History, Banknote, Smartphone, Landmark, HandCoins, MoreHorizontal, SlidersHorizontal } from 'lucide-react'
import DateRangeQuick from '../components/common/DateRangeQuick'
import PageTitle from '../components/common/PageTitle'
import ColumnFilter from '../components/common/ColumnFilter'
import { useAuth } from '../context/AuthContext'
import { useSales } from '../hooks/useSales'
import { useSuppliers } from '../hooks/useSuppliers'
import { useProductSearch } from '../hooks/useProducts'
import LoadMoreRow from '../components/common/LoadMoreRow'
import ProductThumb from '../components/products/ProductThumb'
import { useEmployees } from '../hooks/useEmployees'
import { useDebounce } from '../hooks/useDebounce'
import { productsApi } from '../services/endpoints/products'
import ScannerInput from '../components/ScannerInput'
import SaleDetailModal from '../components/reports/SaleDetailModal'
import CustomerSelectModal from '../components/customers/CustomerSelectModal'
import HelpDrawer from '../components/common/HelpDrawer'
import { useDailySummary } from '../hooks/useReports'
import { localISODate } from '../utils/formatDate'
import { formatQty } from '../utils/quantity'
import { useT, dateLocale } from '../i18n'

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat(dateLocale(), {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(dateStr))
}

function formatCurrency(value) {
  if (value == null) return '—'
  return formatPrice(value) // moneda del negocio
}

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-5 py-3.5">
          <div className="h-4 animate-pulse rounded-lg bg-gray-100" />
        </td>
      ))}
    </tr>
  )
}

// ── Piezas del diseño (mismo lenguaje que Dashboard, Productos y Stock) ──────

function yesterdayStr() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return localISODate(d)
}

// Franja azul: lo vendido HOY y cómo va contra ayer.
function SalesTodayHero({ revenue, yesterday, count, units, loading }) {
  const t = useT()
  const a = Number(revenue ?? 0), b = Number(yesterday ?? 0)
  const pct = b > 0 ? Math.round(((a - b) / b) * 100) : null
  const avg = count > 0 ? a / count : 0
  const cells = [
    [t('Ventas'), loading ? '—' : count],
    [t('Ticket promedio'), loading ? '—' : formatCurrency(avg)],
    ...(units != null ? [[t('Unidades'), loading ? '—' : formatQty(units)]] : []),
  ]
  return (
    <div className="relative overflow-hidden rounded-2xl bg-blue-600 p-5 text-white shadow-md shadow-blue-600/30 sm:p-6" data-testid="sales-hero">
      <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-20 right-24 h-40 w-40 rounded-full bg-white/5" />
      <ShoppingCart className="pointer-events-none absolute right-5 top-5 h-10 w-10 text-white/25 sm:h-12 sm:w-12" />
      <p className="relative text-xs font-semibold uppercase tracking-widest text-white/80">{t('Vendido hoy')}</p>
      {loading ? (
        <div className="relative mt-2 h-10 w-40 animate-pulse rounded-lg bg-white/20" />
      ) : (
        <>
          <p className="relative mt-1 text-4xl font-extrabold tracking-tight sm:text-5xl">{formatCurrency(a)}</p>
          {yesterday != null && (
            <p className="relative mt-2 inline-flex flex-wrap items-center gap-1.5 text-xs text-white/80">
              {pct != null && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-white/20 px-2 py-0.5 font-bold text-white">
                  {pct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {pct === 0 ? t('igual') : `${pct > 0 ? '+' : ''}${pct}%`}
                </span>
              )}
              {pct != null ? t('vs ayer ({v})', { v: formatCurrency(b) }) : t('Ayer: {v}', { v: formatCurrency(b) })}
            </p>
          )}
        </>
      )}
      <div className={`relative mt-5 grid gap-2 border-t border-white/20 pt-4 ${cells.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {cells.map(([label, value]) => (
          <div key={label} className="min-w-0">
            <p className="truncate text-[11px] font-medium uppercase tracking-wide text-white/70">{label}</p>
            <p className="truncate text-lg font-bold">{value}</p>
          </div>
        ))}
      </div>
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

// Cómo pagaron: un toque filtra (feedback William).
const PAY_SHORTCUTS = [
  { value: '',              label: 'Todas',          icon: ShoppingCart },
  { value: 'Efectivo',      label: 'Efectivo',       icon: Banknote },
  { value: 'Yape',          label: 'Yape',           icon: Smartphone },
  { value: 'Transferencia', label: 'Transferencia',  icon: Landmark },
  { value: 'FIADO',         label: 'Fiado',          icon: HandCoins },
  { value: '__otro__',      label: 'Otro...',        icon: MoreHorizontal },
]

// Burbujas de una venta: fiado / cómo pagó / bajo precio / descuento / devolución.
function SaleBadges({ sale }) {
  const t = useT()
  return (
    <>
      {sale.onCredit && (
        <span
          title={`${t('Venta al fiado')}${sale.customerName ? ' — ' + sale.customerName : ''} (${t('cobro pendiente')})`}
          className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700"
        >
          {t('Fiado')}
        </span>
      )}
      {/* Burbuja hermana de la de fiado: cómo pagó (William) */}
      {!sale.onCredit && sale.paymentMethod && (
        <span
          title={t('Pagado con {method}', { method: sale.paymentMethod })}
          className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700"
        >
          {sale.paymentMethod}
        </span>
      )}
      {/* Vendido por debajo del precio de venta (William, 15-sep): se ve sin abrir el detalle */}
      {Number(sale.belowListAmount) > 0 && (
        <span
          title={
            sale.belowListCount === 1
              ? t('1 producto vendido por debajo del precio de venta (−{amount})', { amount: formatCurrency(sale.belowListAmount) })
              : t('{n} productos vendidos por debajo del precio de venta (−{amount})', { n: sale.belowListCount, amount: formatCurrency(sale.belowListAmount) })
          }
          className="inline-flex items-center gap-0.5 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700"
          data-testid="below-list-pill"
        >
          <TrendingDown size={9} />
          −{formatCurrency(sale.belowListAmount)}
        </span>
      )}
      {sale.discountAmount > 0 && (
        <span
          title={
            sale.discountType === 'PERCENTAGE'
              ? `${t('Descuento')}: ${sale.discountValue}% (−${formatCurrency(sale.discountAmount)})`
              : `${t('Descuento')}: −${formatCurrency(sale.discountAmount)}`
          }
          className="inline-flex items-center gap-0.5 rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold text-orange-700"
        >
          <Tag size={9} />
          {sale.discountType === 'PERCENTAGE'
            ? `-${sale.discountValue}%`
            : `-${formatCurrency(sale.discountAmount)}`}
        </span>
      )}
      {/* Burbuja de devolución (William): saber que la venta se anuló sin abrir el detalle */}
      {sale.returnedAmount > 0 && (
        <span
          title={
            Number(sale.returnedAmount) >= Number(sale.total)
              ? t('Venta devuelta por completo (−{amount})', { amount: formatCurrency(sale.returnedAmount) })
              : t('Devolución parcial: −{amount} de {total}', { amount: formatCurrency(sale.returnedAmount), total: formatCurrency(sale.total) })
          }
          className="inline-flex items-center gap-0.5 rounded-full bg-purple-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-purple-700"
        >
          {Number(sale.returnedAmount) >= Number(sale.total) ? t('Devuelto') : t('Dev. parcial')}
        </span>
      )}
    </>
  )
}

const isFullyReturned = (sale) => sale.returnedAmount > 0 && Number(sale.returnedAmount) >= Number(sale.total)

const PAGE_SIZE = 20
const inputCls = 'rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 bg-white'

export default function SalesPage() {
  const navigate = useNavigate()
  const t = useT()
  const { user } = useAuth()
  const canCreate = user?.role === 'OWNER' || user?.role === 'EMPLOYEE'

  // ── Date filter ───────────────────────────────────────────────────────────
  const [from, setFrom] = useState('')
  const [to,   setTo]   = useState('')

  // ── Product multi-select filter ───────────────────────────────────────────
  const [productSearch, setProductSearch]     = useState('')
  const [showProdDrop, setShowProdDrop]       = useState(false)
  const [selectedProducts, setSelectedProducts] = useState([])   // [{id, name}]
  const debouncedProd = useDebounce(productSearch, 350)
  const scanLockRef   = useRef(false)

  const prodSearch = useProductSearch(debouncedProd)
  const { items: prodResults, isLoading: loadingProds } = prodSearch

  const addProduct = (p) => {
    if (!selectedProducts.find((x) => x.id === p.id)) {
      setSelectedProducts((prev) => [...prev, { id: p.id, name: p.name }])
    }
    setProductSearch('')
    setShowProdDrop(false)
  }

  const removeProduct = (id) =>
    setSelectedProducts((prev) => prev.filter((p) => p.id !== id))

  const handleProductScan = async (code) => {
    if (scanLockRef.current) return
    scanLockRef.current = true
    try {
      const product = (await productsApi.scanCode(code)).data.data
      addProduct(product)
    } catch {
      // code not found — user can search manually
    } finally {
      scanLockRef.current = false
    }
  }

  // ── Supplier filter ───────────────────────────────────────────────────────
  const [supplierId, setSupplierId] = useState('')

  // ── Customer filter (tarea 250: ventas por cliente) ───────────────────────
  const [customerFilter, setCustomerFilter] = useState(null)   // {id, name} | null
  const [pickingCustomer, setPickingCustomer] = useState(false)
  const { data: suppliersData } = useSuppliers({ size: 200 })
  const suppliers = suppliersData?.content ?? []

  // ── Column filters (empleado, total) + orden ──────────────────────────────
  const canFilterEmployee = user?.role === 'OWNER' || user?.role === 'SUPER_ADMIN'
  const [employeeId, setEmployeeId] = useState('')
  // Forma de pago: valores comunes + "FIADO" (especial: filtra onCredit) +
  // texto libre para lo que el cajero haya escrito en "Otro".
  const [payFilter, setPayFilter]       = useState('')
  const [payFilterText, setPayFilterText] = useState('')
  const debPayText = useDebounce(payFilterText, 350)
  const effectivePayFilter = payFilter === '__otro__' ? debPayText.trim() : payFilter
  const [totalMin, setTotalMin]     = useState('')
  const [totalMax, setTotalMax]     = useState('')
  const [sort, setSort]             = useState({ key: 'createdAt', dir: 'desc' })
  const debTotalMin = useDebounce(totalMin, 350)
  const debTotalMax = useDebounce(totalMax, 350)

  // Para filtrar ventas importa quién vendió: el dueño (que suele ser quien más
  // vende) y los empleados dados de baja con ventas históricas también cuentan.
  const { data: employeesData } = useEmployees({
    size: 200,
    sort: 'name,asc',
    includeOwner: true,
    includeInactive: true,
    ...(user?.role === 'SUPER_ADMIN' && user?.businessId && { businessId: user.businessId }),
  }, { enabled: canFilterEmployee })
  const employeeOpts = (employeesData?.content ?? []).map((e) => ({
    value: e.id,
    label: e.role === 'OWNER' ? `${e.name} (${t('dueño')})` : e.active ? e.name : `${e.name} (${t('de baja')})`,
  }))

  const sortStateFor = (key) => (sort.key === key ? sort.dir : null)
  const onSortBy     = (key) => (dir) => setSort(dir ? { key, dir } : { key: 'createdAt', dir: 'desc' })
  const sortBy       = `${sort.key},${sort.dir}`
  const labelOf      = (opts, val) => opts.find((o) => String(o.value) === String(val))?.label ?? val

  // ── Pagination ────────────────────────────────────────────────────────────
  const [page, setPage] = useState(0)
  const [selectedSaleId, setSelectedSaleId] = useState(null)

  const hasFilters = from || to || selectedProducts.length > 0 || supplierId ||
    employeeId || debTotalMin !== '' || debTotalMax !== '' || effectivePayFilter !== '' || customerFilter

  const params = {
    page,
    size: PAGE_SIZE,
    sort: sortBy,
    ...(from && { from }),
    ...(to   && { to }),
    ...(selectedProducts.length > 0 && { productIds: selectedProducts.map((p) => p.id) }),
    ...(supplierId && { supplierId }),
    ...(employeeId && { employeeId }),
    ...(debTotalMin !== '' && { totalMin: debTotalMin }),
    ...(debTotalMax !== '' && { totalMax: debTotalMax }),
    ...(effectivePayFilter !== '' && { paymentMethod: effectivePayFilter }),
    ...(customerFilter && { customerId: customerFilter.id }),
    ...(user?.role === 'SUPER_ADMIN' && user?.businessId && { businessId: user.businessId }),
  }

  const { data, isLoading, isFetching } = useSales(params)

  // Franja de hoy: el dueño ve el resumen del día (mismo número que el
  // Dashboard) con la comparación contra ayer; el vendedor, lo que sale de la
  // lista de ventas de hoy.
  const isManager = user?.role === 'OWNER' || user?.role === 'SUPER_ADMIN'
  const scope = user?.role === 'SUPER_ADMIN' && user?.businessId ? { businessId: user.businessId } : {}
  const today = localISODate()
  const { data: summary, isLoading: loadingSummary } = useDailySummary({ date: today, ...scope }, { enabled: isManager })
  const { data: ySummary } = useDailySummary({ date: yesterdayStr(), ...scope }, { enabled: isManager })
  const { data: todaySales, isLoading: loadingToday } = useSales({ from: today, to: today, size: 500, ...scope }, { enabled: !isManager })
  const hero = isManager
    ? { revenue: summary?.totalRevenue, yesterday: ySummary?.totalRevenue ?? null, count: summary?.totalSales ?? 0, units: summary?.totalItemsSold ?? 0, loading: loadingSummary }
    : {
        revenue: (todaySales?.content ?? []).reduce((acc, x) => acc + Number(x.total ?? 0) - Number(x.returnedAmount ?? 0), 0),
        yesterday: null, count: todaySales?.totalElements ?? 0, units: null, loading: loadingToday,
      }

  const sales         = data?.content       ?? []
  const totalElements = data?.totalElements ?? 0
  const totalPages    = data?.totalPages    ?? 0
  const fromRow       = totalElements === 0 ? 0 : page * PAGE_SIZE + 1
  const toRow         = Math.min((page + 1) * PAGE_SIZE, totalElements)

  useEffect(() => { setPage(0) }, [employeeId, debTotalMin, debTotalMax, sortBy])

  const clearAll = () => {
    setFrom(''); setTo(''); setSelectedProducts([]); setSupplierId('')
    setEmployeeId(''); setTotalMin(''); setTotalMax('')
    setPayFilter(''); setPayFilterText(''); setCustomerFilter(null); setPage(0)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <PageTitle icon={ShoppingCart} tone="blue">{t('Ventas')}</PageTitle>
          <HelpDrawer title={t('Cómo usar Ventas')} autoOpenKey="eazystock_sales_help_v2">
            <p>{t('El')} <strong>{t('historial de todas tus ventas')}</strong>, {t('de la más reciente a la más antigua.')}</p>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">{t('👆 Click en cualquier venta')}</p>
              <p className="mt-1">{t('Ves el detalle completo: productos, cantidades, vendedor y forma de pago. Desde ahí también puedes')} <strong>{t('registrar una devolución')}</strong>.</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">{t('↩️ Devoluciones desde el detalle')}</p>
              <p className="mt-1">{t('Con el permiso de anular ventas, pulsa «Registrar devolución», indica cuánto devuelve cada producto y confirma. El stock se repone solo y, si fue al fiado, la deuda del cliente baja.')}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">{t('🟣 Burbuja «Devuelto / Dev. parcial»')}</p>
              <p className="mt-1">{t('Junto al total, una burbuja morada avisa si la venta se devolvió por completo (el total aparece tachado) o solo en parte — sin abrir el detalle.')}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">{t('💳 Ventas al fiado')}</p>
              <p className="mt-1">{t('Las ventas a crédito muestran un chip con la')} <strong>{t('deuda pendiente o saldada')}</strong>. {t('El total por cobrar lo ves en la página Cuentas.')}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">{t('🔽 Filtros por columna')}</p>
              <p className="mt-1">{t('Las cabeceras Fecha, Empleado y Total tienen un embudo estilo Excel: ordena, elige un empleado o acota el total por rango. Arriba también filtras por fecha, producto (buscador o escáner), proveedor y forma de pago.')}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">{t('🛒 Botones de arriba')}</p>
              <p className="mt-1"><strong>{t('"Nueva venta"')}</strong> {t('abre el punto de venta.')} <strong>{t('"Cotización"')}</strong> {t('crea un presupuesto para un cliente sin descontar stock.')}</p>
            </div>
            <p className="text-xs text-gray-400">{t('Tip: usa el buscador o el escáner para encontrar una venta por producto.')}</p>
          </HelpDrawer>
        </div>
      </div>

      {/* Franja de hoy + accesos grandes */}
      <div className={`grid grid-cols-1 gap-4 ${canCreate ? 'lg:grid-cols-3' : ''}`}>
        <div className={canCreate ? 'lg:col-span-2' : ''}>
          <SalesTodayHero {...hero} />
        </div>
        {canCreate && (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1 lg:content-start">
            <ActionTile primary icon={Plus} label={t('Nueva venta')} hint={t('Cobrar y descontar stock')}
              onClick={() => navigate('/sales/new')} className="col-span-2 lg:col-span-1" />
            <ActionTile icon={FileText} label={t('Cotización')} hint={t('Presupuesto sin tocar el stock')}
              onClick={() => navigate('/cotizaciones')} />
            <ActionTile icon={History} label={t('Cotizaciones')} hint={t('Las que ya enviaste')}
              onClick={() => navigate('/cotizaciones/historial')} />
          </div>
        )}
      </div>

      {/* Filtros: formas de pago de un toque + fechas + producto / proveedor / cliente */}
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm sm:p-4">

        {/* Forma de pago (feedback William: poder filtrar cómo pagaron) */}
        <div className="-mx-3 flex items-center gap-2 overflow-x-auto px-3 pb-1 sm:-mx-4 sm:flex-wrap sm:overflow-visible sm:px-4 sm:pb-0">
          {PAY_SHORTCUTS.map(({ value, label, icon: Icon }) => {
            const on = payFilter === value
            return (
              <button key={value || 'all'} type="button"
                onClick={() => { setPayFilter(value); setPayFilterText(''); setPage(0) }}
                aria-pressed={on}
                className={`flex flex-shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-all active:scale-[0.98] ${
                  on
                    ? 'border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-blue-200 hover:bg-gray-50'
                }`}>
                <Icon size={15} className={on ? 'text-white' : 'text-gray-400'} />
                {label === 'Yape' ? label : t(label)}
              </button>
            )
          })}
          {payFilter === '__otro__' && (
            <input
              value={payFilterText}
              onChange={(e) => { setPayFilterText(e.target.value); setPage(0) }}
              placeholder={t('Escribe la forma de pago...')}
              className={`${inputCls} w-48 flex-shrink-0`}
              autoFocus
            />
          )}
        </div>

        <div className="border-t border-gray-100 pt-4">
          <DateRangeQuick
            from={from}
            to={to}
            onChange={(r) => { setFrom(r.from ?? ''); setTo(r.to ?? ''); setPage(0) }}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 border-t border-gray-100 pt-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto] md:items-end">
          {/* Producto (buscador o escáner) */}
          <div className="flex min-w-0 flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">{t('Filtrar por producto')}</span>
            <div className="relative">
              <ScannerInput
                value={productSearch}
                onChange={(v) => { setProductSearch(v); setShowProdDrop(true); setPage(0) }}
                onScan={handleProductScan}
                placeholder={t('Buscar producto o escanear código...')}
              />
              {showProdDrop && debouncedProd && (
                <div className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-gray-100 bg-white shadow-xl">
                  {loadingProds ? (
                    <p className="px-4 py-3 text-sm text-gray-400">{t('Buscando...')}</p>
                  ) : prodResults.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-gray-400">{t('Sin resultados')}</p>
                  ) : (
                    <>
                      {prodResults.map((p) => (
                        <button key={p.id} type="button"
                          onClick={() => addProduct(p)}
                          className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-blue-50 first:rounded-t-xl last:rounded-b-xl transition-colors">
                          <span className="flex min-w-0 items-center gap-2.5">
                            <ProductThumb product={p} size={28} />
                            <span className="truncate font-semibold text-gray-900">{p.name}</span>
                          </span>
                          <span className="ml-2 flex-shrink-0 font-mono text-xs text-gray-400">{p.sku}</span>
                        </button>
                      ))}
                      <LoadMoreRow search={prodSearch} />
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Proveedor */}
          <label className="flex min-w-0 flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">{t('Proveedor')}</span>
            <select value={supplierId} onChange={(e) => { setSupplierId(e.target.value); setPage(0) }}
              className={`${inputCls} w-full py-2.5`}>
              <option value="">{t('Todos los proveedores')}</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>

          {/* Cliente (tarea 250): quién compró */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPickingCustomer(true)}
              className={`flex w-full items-center justify-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors md:w-auto ${
                customerFilter
                  ? 'border-blue-300 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <UserRound size={15} />
              <span className="max-w-[12rem] truncate">{customerFilter ? customerFilter.name : t('Cliente')}</span>
            </button>
            {customerFilter && (
              <button onClick={() => { setCustomerFilter(null); setPage(0) }} aria-label={t('Quitar')}
                className="flex items-center justify-center rounded-full p-1.5 text-blue-700 hover:bg-blue-100 transition-colors">
                <X size={14} />
              </button>
            )}
          </div>
          <CustomerSelectModal
            open={pickingCustomer}
            onClose={() => setPickingCustomer(false)}
            onSelect={(c) => { setCustomerFilter({ id: c.id, name: c.name }); setPage(0) }}
            title={t('Ver las ventas de un cliente')}
            showDebt={false}
          />
        </div>

        {/* Filtros activos: productos elegidos + columnas (empleado / total) */}
        {(selectedProducts.length > 0 || employeeId || totalMin !== '' || totalMax !== '' || hasFilters) && (
          <div className="flex flex-wrap items-center gap-1.5">
            {selectedProducts.map((p) => (
              <span key={p.id}
                className="flex items-center gap-1 rounded-full bg-blue-50 py-1 pl-3 pr-1.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
                {p.name}
                <button onClick={() => { removeProduct(p.id); setPage(0) }}
                  className="flex items-center justify-center rounded-full p-0.5 hover:bg-blue-200 transition-colors">
                  <X size={11} />
                </button>
              </span>
            ))}
            {employeeId && (
              <span className="flex items-center gap-1 rounded-full bg-blue-50 py-1 pl-3 pr-1.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
                {t('Empleado')}: {labelOf(employeeOpts, employeeId)}
                <button onClick={() => setEmployeeId('')} className="flex items-center justify-center rounded-full p-0.5 hover:bg-blue-200 transition-colors">
                  <X size={11} />
                </button>
              </span>
            )}
            {(totalMin !== '' || totalMax !== '') && (
              <span className="flex items-center gap-1 rounded-full bg-blue-50 py-1 pl-3 pr-1.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
                {t('Total')}: {totalMin !== '' && totalMax !== '' ? `${formatCurrency(totalMin)}–${formatCurrency(totalMax)}`
                  : totalMin !== '' ? `≥ ${formatCurrency(totalMin)}` : `≤ ${formatCurrency(totalMax)}`}
                <button onClick={() => { setTotalMin(''); setTotalMax('') }} className="flex items-center justify-center rounded-full p-0.5 hover:bg-blue-200 transition-colors">
                  <X size={11} />
                </button>
              </span>
            )}
            {hasFilters && (
              <button onClick={clearAll}
                className="px-1 text-xs font-semibold text-gray-500 hover:text-red-600 transition-colors">
                {t('Limpiar filtros')}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Historial: tabla en PC, tarjetas en el celular */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center gap-2.5 border-b border-gray-100 px-4 py-3 sm:px-5">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <ShoppingCart size={15} />
          </div>
          <h3 className="text-sm font-semibold text-gray-900">{t('Historial de ventas')}</h3>
          {!isLoading && (
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">{totalElements}</span>
          )}
          {isFetching && !isLoading && (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          )}
          <span className="ml-auto hidden items-center gap-1 text-xs text-gray-400 lg:flex">
            {t('Filtra y ordena desde el')} <SlidersHorizontal size={11} /> {t('de cada columna')}
          </span>
        </div>

        <div className="md:hidden">
          {isLoading ? (
            <div className="space-y-3 p-4">{[1, 2, 3, 4].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100" />)}</div>
          ) : sales.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-5 py-14 text-center">
              <p className="text-sm font-semibold text-gray-700">{t('No hay ventas con estos filtros')}</p>
              {canCreate && (
                <button onClick={() => navigate('/sales/new')}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm">
                  <Plus size={14} /> {t('Registrar venta')}
                </button>
              )}
            </div>
          ) : (
            <ul className={`divide-y divide-gray-100 ${isFetching ? 'opacity-60' : ''}`}>
              {sales.map((sale) => (
                <li key={sale.id}>
                  <button type="button" onClick={() => setSelectedSaleId(sale.id)}
                    className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-blue-50/40">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <ShoppingCart size={17} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {sale.customerName ?? t('{n} items', { n: sale.items?.length ?? 0 })}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-gray-400">
                        {formatDate(sale.createdAt)} · {sale.employeeName ?? sale.createdByName ?? '—'}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1"><SaleBadges sale={sale} /></div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className={`text-base font-bold ${isFullyReturned(sale) ? 'text-slate-400 line-through' : 'text-gray-900'}`}>{formatCurrency(sale.total)}</p>
                      {sale.customerName && <p className="text-[11px] text-gray-400">{t('{n} items', { n: sale.items?.length ?? 0 })}</p>}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-widest text-gray-400">#</th>
                <ColumnFilter label={t('Fecha')} align="left"
                  sortState={sortStateFor('createdAt')} onSort={onSortBy('createdAt')}
                  ascLabel={t('Antiguas')} descLabel={t('Recientes')} />
                {canFilterEmployee ? (
                  <ColumnFilter label={t('Empleado')} type="select" align="left"
                    value={employeeId} onChange={setEmployeeId}
                    options={employeeOpts} active={!!employeeId}
                    onClear={() => setEmployeeId('')} />
                ) : (
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">{t('Empleado')}</th>
                )}
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">{t('Cliente')}</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-widest text-gray-400">{t('Productos')}</th>
                <ColumnFilter label={t('Total')} type="range" align="right"
                  rangeMin={totalMin} rangeMax={totalMax}
                  onRangeChange={({ min, max }) => { setTotalMin(min); setTotalMax(max) }}
                  active={totalMin !== '' || totalMax !== ''}
                  sortState={sortStateFor('total')} onSort={onSortBy('total')}
                  ascLabel={t('Menor')} descLabel={t('Mayor')}
                  onClear={() => { setTotalMin(''); setTotalMax('') }} />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="flex flex-col items-center gap-4 py-16">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
                        <ShoppingCart size={28} className="text-gray-400" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-gray-700">{t('No hay ventas con estos filtros')}</p>
                        <p className="mt-1 text-xs text-gray-400">{t('Ajusta los filtros o registra una nueva venta')}</p>
                      </div>
                      {canCreate && (
                        <button onClick={() => navigate('/sales/new')}
                          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-all active:scale-[0.98]">
                          <Plus size={14} />
                          {t('Registrar venta')}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                sales.map((sale, idx) => (
                  <tr
                    key={sale.id}
                    onClick={() => setSelectedSaleId(sale.id)}
                    title={t('Ver detalle de la venta')}
                    className={`cursor-pointer border-b border-gray-50 transition-colors hover:bg-blue-50/40 ${isFetching ? 'opacity-60' : ''}`}
                  >
                    <td className="px-5 py-3.5 text-center text-xs font-mono text-gray-400">
                      {page * PAGE_SIZE + idx + 1}
                    </td>
                    <td className="px-5 py-3.5 text-gray-700 whitespace-nowrap text-xs">
                      {formatDate(sale.createdAt)}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-gray-800">
                      {sale.employeeName ?? sale.createdByName ?? '—'}
                    </td>
                    <td className="px-5 py-3.5 text-gray-700">
                      {sale.customerName ? (
                        <span className="inline-flex max-w-[12rem] items-center gap-1 truncate">
                          <UserRound size={12} className="flex-shrink-0 text-blue-500" />
                          <span className="truncate">{sale.customerName}</span>
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
                        {t('{n} items', { n: sale.items?.length ?? 0 })}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-gray-900">
                      <div className="flex items-center justify-end gap-2">
                        <SaleBadges sale={sale} />
                        <span className={isFullyReturned(sale) ? 'text-slate-400 line-through' : ''}>
                          {formatCurrency(sale.total)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 px-4 py-3.5 sm:px-5">
            <p className="text-sm text-gray-400">
              <span className="font-semibold text-gray-700">{fromRow}–{toRow}</span> {t('de')}{' '}
              <span className="font-semibold text-gray-700">{totalElements}</span> {t('ventas')}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                className="flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                <ChevronLeft size={14} />{t('Anterior')}
              </button>
              <span className="px-3 text-sm font-medium text-gray-500">{page + 1} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                {t('Siguiente')}<ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedSaleId && (
        <SaleDetailModal
          saleId={selectedSaleId}
          onClose={() => setSelectedSaleId(null)}
        />
      )}
    </div>
  )
}
