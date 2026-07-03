import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Scale, TrendingUp, TrendingDown, Loader2,
  Wallet, PackageOpen, PiggyBank, ShoppingCart, Undo2, AlertTriangle,
} from 'lucide-react'
import { useSalesBalance, useCashBalance, useBusinessOverview } from '../hooks/useReports'
import { useAuth } from '../context/AuthContext'
import { formatPrice } from '../utils/formatMoney'
import DateRangeQuick from '../components/common/DateRangeQuick'
import { quickRange } from '../utils/dateRanges'
import PageTitle from '../components/common/PageTitle'
import HelpDrawer from '../components/common/HelpDrawer'

function S({ title, children }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3">
      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-gray-500">{title}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}

function BalanceHelp() {
  return (
    <>
      <p>
        Esta página te dice, en un vistazo, <span className="font-semibold">cuánto ganó tu
        negocio</span> en el período que elijas y cuánto vale tu inventario hoy.
      </p>
      <S title="1 · Elige el período">
        <p>
          Toca <span className="font-semibold">Hoy</span>, <span className="font-semibold">Esta
          semana</span>, <span className="font-semibold">Este mes</span> o{' '}
          <span className="font-semibold">Este año</span> y los números se actualizan solos.
          Con <span className="font-semibold">"Elegir fechas"</span> pones tú el desde y el hasta
          (por ejemplo, para comparar un mes del año pasado). Mirando el mismo período de meses
          distintos ves si el negocio está creciendo o bajando.
        </p>
      </S>
      <S title="2 · Balance de ventas — qué significa cada línea">
        <p><span className="font-semibold">Ventas brutas</span>: todo lo vendido, antes de descuentos.</p>
        <p><span className="font-semibold">Descuentos</span>: lo que rebajaste sobre el total de las ventas.</p>
        <p><span className="font-semibold">Devoluciones</span>: el dinero devuelto a clientes (la mercadería vuelve al stock).</p>
        <p><span className="font-semibold">Costo del producto</span>: lo que a ti te costó la mercadería vendida.</p>
        <p><span className="font-semibold">Ganancia</span>: lo que te queda después de restar todo lo anterior. Verde = ganaste, rojo = perdiste.</p>
      </S>
      <S title="3 · Ingresos y egresos">
        <p>
          Compara la plata que entró (ventas) contra la que salió (compras de mercadería a
          proveedores) en el mismo período. La diferencia es la ganancia operativa.
        </p>
      </S>
      <S title="4 · Información total del negocio">
        <p><span className="font-semibold">Capital total</span>: cuánto vale todo tu stock a precio de venta.</p>
        <p><span className="font-semibold">Costo de productos</span>: cuánto pagaste por ese stock.</p>
        <p><span className="font-semibold">Ganancia potencial</span>: la diferencia — lo que ganarías si vendieras todo hoy.</p>
        <p className="text-xs text-gray-400">
          Los productos sin precio definido no entran en estas cuentas. Si aparece un aviso naranja,
          tócalo para ponerles precio y que se incluyan.
        </p>
      </S>
    </>
  )
}

function formatRangeLabel(from, to) {
  if (!from || !to) return ''
  const fmt = new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })
  const f = fmt.format(new Date(from + 'T00:00:00'))
  const t = fmt.format(new Date(to + 'T00:00:00'))
  return f === t ? f : `${f} — ${t}`
}

function BalanceLine({ label, value, negative = false, muted = false }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className={`text-sm ${muted ? 'text-gray-400' : 'text-gray-600'}`}>{label}</span>
      <span className={`font-semibold tabular-nums ${negative ? 'text-red-600' : 'text-gray-900'}`}>
        {negative && Number(value) > 0 ? '−' : ''}{formatPrice(value)}
      </span>
    </div>
  )
}

function OverviewCard({ icon: Icon, label, value, tone, subtitle }) {
  const tones = {
    blue:    'bg-blue-50 text-blue-600',
    amber:   'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    red:     'bg-red-50 text-red-600',
  }
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${tones[tone]}`}>
        <Icon size={22} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</p>
        <p className="truncate text-xl font-extrabold text-gray-900">{formatPrice(value)}</p>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>
    </div>
  )
}

export default function BalancePage() {
  const { user } = useAuth()
  const [range, setRange] = useState(() => quickRange('day'))

  const rangeComplete = !!(range?.from && range?.to)
  const baseParams = user?.role === 'SUPER_ADMIN' && user?.businessId
    ? { businessId: user.businessId }
    : {}
  const periodParams = rangeComplete ? { ...baseParams, ...range } : null

  const salesBalance = useSalesBalance(periodParams, { enabled: !!periodParams })
  const cashBalance  = useCashBalance(periodParams,  { enabled: !!periodParams })
  const overview     = useBusinessOverview(baseParams)

  const sb = salesBalance.data
  const cb = cashBalance.data
  const ov = overview.data

  const profitPositive = sb != null && Number(sb.profit) >= 0
  const cashPositive   = cb != null && Number(cb.profit) >= 0

  return (
    <div className="flex flex-col gap-5">

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <PageTitle icon={Scale} tone="emerald">Balance del negocio</PageTitle>
          {rangeComplete && (
            <p className="mt-0.5 text-sm text-gray-400">{formatRangeLabel(range.from, range.to)}</p>
          )}
        </div>
        <HelpDrawer title="Cómo leer el balance" autoOpenKey="eazystock_balance_help_v1">
          <BalanceHelp />
        </HelpDrawer>
      </div>

      {/* Selector de período */}
      <div className="rounded-2xl border border-gray-100 bg-white px-4 py-4 shadow-sm">
        <DateRangeQuick from={range?.from} to={range?.to} onChange={setRange} />
        {!rangeComplete && (
          <p className="mt-2 text-xs text-gray-400">Elige ambas fechas para ver el balance</p>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">

        {/* Balance de ventas */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
                <ShoppingCart size={17} className="text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900">Balance de ventas</h3>
            </div>
            {sb != null && (
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-500">
                {sb.salesCount} venta{sb.salesCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {!periodParams ? (
            <p className="py-8 text-center text-sm text-gray-400">Selecciona un rango de fechas</p>
          ) : salesBalance.isLoading ? (
            <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-gray-400" /></div>
          ) : salesBalance.isError ? (
            <p className="py-8 text-center text-sm text-red-500">No pudimos cargar el balance.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              <BalanceLine label="Ventas brutas" value={sb.grossSales} />
              <BalanceLine label="Descuentos" value={sb.discounts} negative />
              <BalanceLine label="Devoluciones" value={sb.returns} negative />
              <BalanceLine label="Costo del producto" value={sb.productCost} negative />
              <div className="flex items-center justify-between pt-3">
                <span className="flex items-center gap-1.5 text-sm font-bold text-gray-800">
                  {profitPositive
                    ? <TrendingUp size={15} className="text-emerald-600" />
                    : <TrendingDown size={15} className="text-red-600" />}
                  Ganancia
                </span>
                <span className={`text-xl font-extrabold tabular-nums ${profitPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatPrice(sb.profit)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Ingresos y egresos */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
              <Scale size={17} className="text-emerald-600" />
            </div>
            <h3 className="font-bold text-gray-900">Ingresos y egresos</h3>
          </div>

          {!periodParams ? (
            <p className="py-8 text-center text-sm text-gray-400">Selecciona un rango de fechas</p>
          ) : cashBalance.isLoading ? (
            <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-gray-400" /></div>
          ) : cashBalance.isError ? (
            <p className="py-8 text-center text-sm text-red-500">No pudimos cargar el reporte.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              <BalanceLine label="Ingresos por ventas" value={cb.income} />
              <BalanceLine label="Devoluciones" value={cb.returnsRefund} negative />
              <BalanceLine label="Ingresos netos" value={cb.netIncome} />
              <BalanceLine label="Egresos (compras a proveedores)" value={cb.expenses} negative />
              <div className="flex items-center justify-between pt-3">
                <span className="flex items-center gap-1.5 text-sm font-bold text-gray-800">
                  {cashPositive
                    ? <TrendingUp size={15} className="text-emerald-600" />
                    : <TrendingDown size={15} className="text-red-600" />}
                  Ganancia del período
                </span>
                <span className={`text-xl font-extrabold tabular-nums ${cashPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatPrice(cb.profit)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Información total del negocio */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 font-bold text-gray-900">
          <PiggyBank size={17} className="text-gray-400" />
          Información total del negocio
          <span className="text-xs font-normal text-gray-400">(inventario actual)</span>
        </h3>
        {overview.isLoading ? (
          <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-gray-400" /></div>
        ) : overview.isError ? (
          <p className="py-6 text-center text-sm text-red-500">No pudimos cargar la información del negocio.</p>
        ) : ov && (
          <>
          {ov.productsWithoutPrice > 0 && (
            <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
              <AlertTriangle size={15} className="flex-shrink-0" />
              <span>
                <strong>{ov.productsWithoutPrice} producto{ov.productsWithoutPrice !== 1 ? 's' : ''} sin precio definido</strong>{' '}
                no {ov.productsWithoutPrice !== 1 ? 'están incluidos' : 'está incluido'} en estos totales.
              </span>
              <Link
                to="/products?variablePrice=1"
                className="font-semibold text-orange-700 underline hover:text-orange-900"
              >
                Ponerles precio ahora
              </Link>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-3">
            <OverviewCard
              icon={Wallet}
              label="Capital total"
              value={ov.capitalTotal}
              tone="blue"
              subtitle={`${ov.productCount} productos con precio definido`}
            />
            <OverviewCard
              icon={PackageOpen}
              label="Costo de productos"
              value={ov.productCostTotal}
              tone="amber"
              subtitle="Stock valorizado al costo de compra"
            />
            <OverviewCard
              icon={Number(ov.potentialProfit) >= 0 ? TrendingUp : Undo2}
              label="Ganancia potencial"
              value={ov.potentialProfit}
              tone={Number(ov.potentialProfit) >= 0 ? 'emerald' : 'red'}
              subtitle="Si se vende todo el stock actual"
            />
          </div>
          </>
        )}
      </div>
    </div>
  )
}
