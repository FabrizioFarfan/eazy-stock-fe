import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ShoppingCart, ChevronLeft, ChevronRight, X, Tag, FileText } from 'lucide-react'
import DateRangeQuick from '../components/common/DateRangeQuick'
import PageTitle from '../components/common/PageTitle'
import ColumnFilter from '../components/common/ColumnFilter'
import { useAuth } from '../context/AuthContext'
import { useSales } from '../hooks/useSales'
import { useSuppliers } from '../hooks/useSuppliers'
import { useProducts } from '../hooks/useProducts'
import { useEmployees } from '../hooks/useEmployees'
import { useDebounce } from '../hooks/useDebounce'
import { productsApi } from '../services/endpoints/products'
import ScannerInput from '../components/ScannerInput'
import SaleDetailModal from '../components/reports/SaleDetailModal'
import HelpDrawer from '../components/common/HelpDrawer'
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
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value)
}

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 5 }).map((_, i) => (
        <td key={i} className="px-5 py-3.5">
          <div className="h-4 animate-pulse rounded-lg bg-gray-100" />
        </td>
      ))}
    </tr>
  )
}

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

  const { data: prodData, isLoading: loadingProds } = useProducts(
    debouncedProd ? { search: debouncedProd, size: 8, active: true } : null,
    { enabled: !!debouncedProd },
  )
  const prodResults = prodData?.content ?? []

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
    employeeId || debTotalMin !== '' || debTotalMax !== '' || effectivePayFilter !== ''

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
    ...(user?.role === 'SUPER_ADMIN' && user?.businessId && { businessId: user.businessId }),
  }

  const { data, isLoading, isFetching } = useSales(params)

  const sales         = data?.content       ?? []
  const totalElements = data?.totalElements ?? 0
  const totalPages    = data?.totalPages    ?? 0
  const fromRow       = totalElements === 0 ? 0 : page * PAGE_SIZE + 1
  const toRow         = Math.min((page + 1) * PAGE_SIZE, totalElements)

  useEffect(() => { setPage(0) }, [employeeId, debTotalMin, debTotalMax, sortBy])

  const clearAll = () => {
    setFrom(''); setTo(''); setSelectedProducts([]); setSupplierId('')
    setEmployeeId(''); setTotalMin(''); setTotalMax('')
    setPayFilter(''); setPayFilterText(''); setPage(0)
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
          {!isLoading && (
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700">
              {totalElements}
            </span>
          )}
        </div>
        {canCreate && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/cotizaciones')}
              title={t('Crear una cotización (presupuesto) para un cliente')}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <FileText size={15} />
              {t('Cotización')}
            </button>
            <button
              onClick={() => navigate('/sales/new')}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 hover:bg-blue-700 transition-all active:scale-[0.98]"
            >
              <Plus size={15} />
              {t('Nueva venta')}
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-4 shadow-sm">

        {/* Row 1 — Dates */}
        <DateRangeQuick
          from={from}
          to={to}
          onChange={(r) => { setFrom(r.from ?? ''); setTo(r.to ?? ''); setPage(0) }}
        />

        {/* Row 2 — Product filter */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            {t('Filtrar por producto')}
          </span>
          <div className="relative max-w-md">
            <ScannerInput
              value={productSearch}
              onChange={(v) => { setProductSearch(v); setShowProdDrop(true); setPage(0) }}
              onScan={handleProductScan}
              placeholder={t('Buscar producto o escanear código...')}
            />
            {showProdDrop && debouncedProd && (
              <div className="absolute z-20 mt-1 w-full rounded-xl border border-gray-100 bg-white shadow-xl">
                {loadingProds ? (
                  <p className="px-4 py-3 text-sm text-gray-400">{t('Buscando...')}</p>
                ) : prodResults.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-gray-400">{t('Sin resultados')}</p>
                ) : (
                  prodResults.map((p) => (
                    <button key={p.id} type="button"
                      onClick={() => addProduct(p)}
                      className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-blue-50 first:rounded-t-xl last:rounded-b-xl transition-colors">
                      <span className="font-semibold text-gray-900">{p.name}</span>
                      <span className="ml-2 flex-shrink-0 font-mono text-xs text-gray-400">{p.sku}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Selected product tags */}
          {selectedProducts.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedProducts.map((p) => (
                <span key={p.id}
                  className="flex items-center gap-1 rounded-full bg-blue-100 py-0.5 pl-2.5 pr-1.5 text-xs font-semibold text-blue-700">
                  {p.name}
                  <button onClick={() => { removeProduct(p.id); setPage(0) }}
                    className="flex items-center justify-center rounded-full p-0.5 hover:bg-blue-200 transition-colors">
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Row 3 — Supplier filter */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">{t('Proveedor')}</span>
          <select value={supplierId} onChange={(e) => { setSupplierId(e.target.value); setPage(0) }}
            className={`${inputCls} min-w-48`}>
            <option value="">{t('Todos los proveedores')}</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          {/* Forma de pago (feedback William: poder filtrar cómo pagaron) */}
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">{t('Pago')}</span>
          <select value={payFilter}
            onChange={(e) => { setPayFilter(e.target.value); setPayFilterText(''); setPage(0) }}
            className={`${inputCls} min-w-36`}>
            <option value="">{t('Todos')}</option>
            <option value="Efectivo">{t('Efectivo')}</option>
            <option value="Yape">Yape</option>
            <option value="Transferencia">{t('Transferencia')}</option>
            <option value="FIADO">{t('Fiado')}</option>
            <option value="__otro__">{t('Otro...')}</option>
          </select>
          {payFilter === '__otro__' && (
            <input
              value={payFilterText}
              onChange={(e) => { setPayFilterText(e.target.value); setPage(0) }}
              placeholder={t('Escribe la forma de pago...')}
              className={`${inputCls} w-44`}
              autoFocus
            />
          )}

          {/* Chips de filtros de columna (empleado / total) */}
          {employeeId && (
            <span className="flex items-center gap-1 rounded-full bg-blue-50 py-0.5 pl-2.5 pr-1.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
              {t('Empleado')}: {labelOf(employeeOpts, employeeId)}
              <button onClick={() => setEmployeeId('')} className="flex items-center justify-center rounded-full p-0.5 hover:bg-blue-200 transition-colors">
                <X size={10} />
              </button>
            </span>
          )}
          {(totalMin !== '' || totalMax !== '') && (
            <span className="flex items-center gap-1 rounded-full bg-blue-50 py-0.5 pl-2.5 pr-1.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
              {t('Total')}: {totalMin !== '' && totalMax !== '' ? `${formatCurrency(totalMin)}–${formatCurrency(totalMax)}`
                : totalMin !== '' ? `≥ ${formatCurrency(totalMin)}` : `≤ ${formatCurrency(totalMax)}`}
              <button onClick={() => { setTotalMin(''); setTotalMax('') }} className="flex items-center justify-center rounded-full p-0.5 hover:bg-blue-200 transition-colors">
                <X size={10} />
              </button>
            </span>
          )}

          {hasFilters && (
            <button onClick={clearAll}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
              {t('Limpiar filtros')}
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
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
                  <td colSpan={5}>
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
                    <td className="px-5 py-3.5 text-center">
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
                        {t('{n} items', { n: sale.items?.length ?? 0 })}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-gray-900">
                      <div className="flex items-center justify-end gap-2">
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
                        <span className={Number(sale.returnedAmount) >= Number(sale.total) && sale.returnedAmount > 0 ? 'text-slate-400 line-through' : ''}>
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
          <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3.5">
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
