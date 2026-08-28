import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Scale, TrendingUp, TrendingDown, Loader2,
  Wallet, PackageOpen, PiggyBank, ShoppingCart, Undo2, AlertTriangle,
  Banknote, Smartphone, Landmark, CreditCard, HandCoins,
} from 'lucide-react'
import { useSalesBalance, useCashBalance, useBusinessOverview, useCashClosing } from '../hooks/useReports'
import { useAuth } from '../context/AuthContext'
import { formatPrice } from '../utils/formatMoney'
import DateRangeQuick from '../components/common/DateRangeQuick'
import { quickRange } from '../utils/dateRanges'
import PageTitle from '../components/common/PageTitle'
import HelpDrawer from '../components/common/HelpDrawer'
import { useT, dateLocale } from '../i18n'

function S({ title, children }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3">
      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-gray-500">{title}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}

function BalanceHelp() {
  const t = useT()
  return (
    <>
      <p>
        {t('Esta página te dice, en un vistazo,')}{' '}
        <span className="font-semibold">{t('cuánto ganó tu negocio')}</span>{' '}
        {t('en el período que elijas y cuánto vale tu inventario hoy.')}
      </p>
      <S title={t('1 · Elige el período')}>
        <p>
          {t('Toca Hoy, Esta semana, Este mes o Este año y los números se actualizan solos. Con «Elegir fechas» pones tú el desde y el hasta (por ejemplo, para comparar un mes del año pasado). Mirando el mismo período de meses distintos ves si el negocio está creciendo o bajando.')}
        </p>
      </S>
      <S title={t('2 · Cierre de caja — cuánto entró por cada medio de pago')}>
        <p>
          {t('Es la primera card de la página. Separa las ventas al contado del período por cómo te pagaron: Efectivo, Yape, Transferencia o lo que hayas escrito al vender. Sirve para cerrar la caja del día: la línea de Efectivo es la plata que deberías tener en el cajón por las ventas de hoy.')}
        </p>
        <p className="text-xs text-gray-400">
          {t('Las ventas al fiado van en su propia línea y no entran en caja (todavía no cobraste). Los cobros de fiado del día sí entraron, pero no registran medio de pago, por eso también van aparte. Las devoluciones en dinero salieron de caja.')}
        </p>
        <p className="text-xs text-gray-400">
          {t('Un vendedor con el permiso «Ver cierre de caja» solo ve esta card: nunca ganancias, costos ni valorización del negocio.')}
        </p>
      </S>
      <S title={t('3 · Balance de ventas — qué significa cada línea')}>
        <p><span className="font-semibold">{t('Ventas brutas')}</span>: {t('todo lo vendido, antes de descuentos.')}</p>
        <p><span className="font-semibold">{t('Descuentos')}</span>: {t('lo que rebajaste sobre el total de las ventas.')}</p>
        <p><span className="font-semibold">{t('Devoluciones')}</span>: {t('el dinero devuelto a clientes (la mercadería vuelve al stock).')}</p>
        <p><span className="font-semibold">{t('Costo del producto')}</span>: {t('lo que a ti te costó la mercadería vendida.')}</p>
        <p><span className="font-semibold">{t('Ganancia')}</span>: {t('lo que te queda después de restar todo lo anterior. Verde = ganaste, rojo = perdiste.')}</p>
      </S>
      <S title={t('4 · Ingresos y egresos')}>
        <p>
          {t('Compara la plata que entró (ventas) contra la que salió (compras de mercadería a proveedores) en el mismo período. La diferencia es la ganancia operativa.')}
        </p>
      </S>
      <S title={t('5 · Información total del negocio')}>
        <p><span className="font-semibold">{t('Capital total')}</span>: {t('cuánto vale todo tu stock a precio de venta.')}</p>
        <p><span className="font-semibold">{t('Costo de productos')}</span>: {t('cuánto pagaste por ese stock.')}</p>
        <p><span className="font-semibold">{t('Ganancia potencial')}</span>: {t('la diferencia — lo que ganarías si vendieras todo hoy.')}</p>
        <p className="text-xs text-gray-400">
          {t('Los productos sin precio definido no entran en estas cuentas. Si aparece un aviso naranja, tócalo para ponerles precio y que se incluyan.')}
        </p>
      </S>
    </>
  )
}

// Ayuda del vendedor con solo canViewCashClosing: su misión es el confronto
// de fin de día contra lo anotado a mano, sin ver ganancias del negocio.
function CashClosingHelp() {
  const t = useT()
  return (
    <>
      <p>
        {t('Esta página te dice, en un vistazo,')}{' '}
        <span className="font-semibold">{t('cuánto entró en caja')}</span>{' '}
        {t('por cada medio de pago en el período que elijas.')}
      </p>
      <S title={t('1 · Elige el período')}>
        <p>
          {t('Toca Hoy para cerrar la caja del día. Con «Elegir fechas» puedes revisar días anteriores.')}
        </p>
      </S>
      <S title={t('2 · El confronto de fin de día')}>
        <p>
          {t('Compara lo que anotaste a mano con lo que dice el sistema: Efectivo, Yape, Transferencia o lo que hayas escrito al vender. La línea de Efectivo es la plata que deberías tener en el cajón por las ventas de hoy. Si coincide, la caja cierra bien.')}
        </p>
        <p className="text-xs text-gray-400">
          {t('Las ventas al fiado van en su propia línea y no entran en caja (todavía no se cobraron). Los cobros de fiado del día sí entraron, pero no tienen medio de pago registrado, por eso van aparte. Las devoluciones en dinero salieron de caja.')}
        </p>
      </S>
    </>
  )
}

function formatRangeLabel(from, to) {
  if (!from || !to) return ''
  const fmt = new Intl.DateTimeFormat(dateLocale(), { day: 'numeric', month: 'short', year: 'numeric' })
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

// Ícono por medio de pago: se adivina por el texto que escribió el cajero.
function methodIcon(method) {
  const m = (method || '').toLowerCase()
  if (m.includes('efectivo') || m.includes('cash'))   return { Icon: Banknote,   cls: 'bg-emerald-50 text-emerald-600' }
  if (m.includes('yape') || m.includes('plin'))       return { Icon: Smartphone, cls: 'bg-purple-50 text-purple-600' }
  if (m.includes('transfer') || m.includes('banco'))  return { Icon: Landmark,   cls: 'bg-blue-50 text-blue-600' }
  if (m.includes('tarjeta') || m.includes('pos'))     return { Icon: CreditCard, cls: 'bg-amber-50 text-amber-600' }
  return { Icon: Wallet, cls: 'bg-gray-100 text-gray-500' }
}

function CashClosingCard({ report, isLoading, isError, hasRange }) {
  const t = useT()
  const cc = report
  const body = () => {
    if (!hasRange) return <p className="py-8 text-center text-sm text-gray-400">{t('Selecciona un rango de fechas')}</p>
    if (isLoading) return <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-gray-400" /></div>
    if (isError)   return <p className="py-8 text-center text-sm text-red-500">{t('No pudimos cargar el cierre de caja.')}</p>
    if (!cc) return null

    const noMovement = cc.byMethod.length === 0 && Number(cc.creditSalesTotal) === 0
      && Number(cc.debtPaymentsReceived) === 0 && Number(cc.cashRefunds) === 0
    if (noMovement) {
      return <p className="py-8 text-center text-sm text-gray-400">{t('Sin ventas al contado en este período.')}</p>
    }

    const max = Math.max(...cc.byMethod.map((l) => Number(l.total)), 1)
    return (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {cc.byMethod.map((line) => {
            const { Icon, cls } = methodIcon(line.method)
            const pct = Math.max(4, Math.round((Number(line.total) / max) * 100))
            return (
              <div key={line.method} className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${cls}`}>
                    <Icon size={19} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold uppercase tracking-widest text-gray-500">{line.method}</p>
                    <p className="text-xl font-extrabold tabular-nums text-gray-900">{formatPrice(line.total)}</p>
                  </div>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-gray-500 ring-1 ring-gray-100">
                    {line.salesCount !== 1 ? t('{n} ventas', { n: line.salesCount }) : t('{n} venta', { n: line.salesCount })}
                  </span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-200/70">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>

        <div className="divide-y divide-gray-50 rounded-2xl border border-gray-100 px-4">
          <div className="flex items-center justify-between py-2.5">
            <span className="text-sm font-bold text-gray-800">{t('Total ventas al contado')}</span>
            <span className="text-lg font-extrabold tabular-nums text-gray-900">{formatPrice(cc.cashSalesTotal)}</span>
          </div>
          {Number(cc.debtPaymentsReceived) > 0 && (
            <div className="flex items-center justify-between py-2.5">
              <span className="flex items-center gap-1.5 text-sm text-gray-600">
                <HandCoins size={14} className="text-gray-400" />
                {t('Cobros de fiado recibidos')}
                <span className="text-xs text-gray-400">{t('(sin medio registrado)')}</span>
              </span>
              <span className="font-semibold tabular-nums text-gray-900">+{formatPrice(cc.debtPaymentsReceived)}</span>
            </div>
          )}
          {Number(cc.cashRefunds) > 0 && (
            <BalanceLine label={t('Devoluciones en dinero')} value={cc.cashRefunds} negative />
          )}
          {cc.creditSalesCount > 0 && (
            <div className="flex items-center justify-between py-2.5">
              <span className="text-sm text-gray-400">
                {t('Ventas al fiado ({n}) · no entraron en caja', { n: cc.creditSalesCount })}
              </span>
              <span className="font-semibold tabular-nums text-gray-400">{formatPrice(cc.creditSalesTotal)}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
            <Banknote size={17} className="text-emerald-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{t('Cierre de caja')}</h3>
            <p className="text-xs text-gray-400">{t('Cuánto entró por cada medio de pago')}</p>
          </div>
        </div>
        {cc != null && hasRange && (
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-500">
            {t('{n} al contado', { n: cc.cashSalesCount })}
          </span>
        )}
      </div>
      {body()}
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
  const t = useT()
  const { user, can } = useAuth()
  const [range, setRange] = useState(() => quickRange('day'))

  // Vendedor con solo canViewCashClosing: ve ÚNICAMENTE el cierre de caja del
  // período (medios de pago), nunca ganancias, costos ni valorización.
  const fullReports = can('canViewReports')

  const rangeComplete = !!(range?.from && range?.to)
  const baseParams = user?.role === 'SUPER_ADMIN' && user?.businessId
    ? { businessId: user.businessId }
    : {}
  const periodParams = rangeComplete ? { ...baseParams, ...range } : null

  const salesBalance = useSalesBalance(periodParams, { enabled: !!periodParams && fullReports })
  const cashBalance  = useCashBalance(periodParams,  { enabled: !!periodParams && fullReports })
  const cashClosing  = useCashClosing(periodParams,  { enabled: !!periodParams })
  const overview     = useBusinessOverview(baseParams, { enabled: fullReports })

  const sb = salesBalance.data
  const cb = cashBalance.data
  const ov = overview.data

  const profitPositive = sb != null && Number(sb.profit) >= 0
  const cashPositive   = cb != null && Number(cb.profit) >= 0

  return (
    <div className="flex flex-col gap-5">

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <PageTitle icon={Scale} tone="emerald">{fullReports ? t('Balance del negocio') : t('Cierre de caja')}</PageTitle>
          {rangeComplete && (
            <p className="mt-0.5 text-sm text-gray-400">{formatRangeLabel(range.from, range.to)}</p>
          )}
        </div>
        {fullReports ? (
          <HelpDrawer title={t('Cómo leer el balance')} autoOpenKey="eazystock_balance_help_v2">
            <BalanceHelp />
          </HelpDrawer>
        ) : (
          <HelpDrawer title={t('Cómo cerrar la caja')} autoOpenKey="eazystock_cash_closing_help_v1">
            <CashClosingHelp />
          </HelpDrawer>
        )}
      </div>

      {/* Selector de período */}
      <div className="rounded-2xl border border-gray-100 bg-white px-4 py-4 shadow-sm">
        <DateRangeQuick from={range?.from} to={range?.to} onChange={setRange} />
        {!rangeComplete && (
          <p className="mt-2 text-xs text-gray-400">{t('Elige ambas fechas para ver el balance')}</p>
        )}
      </div>

      {/* Cierre de caja: por medio de pago (pedido de William para cerrar el día) */}
      <CashClosingCard
        report={cashClosing.data}
        isLoading={cashClosing.isLoading}
        isError={cashClosing.isError}
        hasRange={!!periodParams}
      />

      {fullReports && (
      <div className="grid gap-5 lg:grid-cols-2">

        {/* Balance de ventas */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
                <ShoppingCart size={17} className="text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900">{t('Balance de ventas')}</h3>
            </div>
            {sb != null && (
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-500">
                {sb.salesCount !== 1 ? t('{n} ventas', { n: sb.salesCount }) : t('{n} venta', { n: sb.salesCount })}
              </span>
            )}
          </div>

          {!periodParams ? (
            <p className="py-8 text-center text-sm text-gray-400">{t('Selecciona un rango de fechas')}</p>
          ) : salesBalance.isLoading ? (
            <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-gray-400" /></div>
          ) : salesBalance.isError ? (
            <p className="py-8 text-center text-sm text-red-500">{t('No pudimos cargar el balance.')}</p>
          ) : (
            <div className="divide-y divide-gray-50">
              <BalanceLine label={t('Ventas brutas')} value={sb.grossSales} />
              <BalanceLine label={t('Descuentos')} value={sb.discounts} negative />
              <BalanceLine label={t('Devoluciones')} value={sb.returns} negative />
              <BalanceLine label={t('Costo del producto')} value={sb.productCost} negative />
              <div className="flex items-center justify-between pt-3">
                <span className="flex items-center gap-1.5 text-sm font-bold text-gray-800">
                  {profitPositive
                    ? <TrendingUp size={15} className="text-emerald-600" />
                    : <TrendingDown size={15} className="text-red-600" />}
                  {t('Ganancia')}
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
            <h3 className="font-bold text-gray-900">{t('Ingresos y egresos')}</h3>
          </div>

          {!periodParams ? (
            <p className="py-8 text-center text-sm text-gray-400">{t('Selecciona un rango de fechas')}</p>
          ) : cashBalance.isLoading ? (
            <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-gray-400" /></div>
          ) : cashBalance.isError ? (
            <p className="py-8 text-center text-sm text-red-500">{t('No pudimos cargar el reporte.')}</p>
          ) : (
            <div className="divide-y divide-gray-50">
              <BalanceLine label={t('Ingresos por ventas')} value={cb.income} />
              <BalanceLine label={t('Devoluciones')} value={cb.returnsRefund} negative />
              <BalanceLine label={t('Ingresos netos')} value={cb.netIncome} />
              <BalanceLine label={t('Egresos (compras a proveedores)')} value={cb.expenses} negative />
              <div className="flex items-center justify-between pt-3">
                <span className="flex items-center gap-1.5 text-sm font-bold text-gray-800">
                  {cashPositive
                    ? <TrendingUp size={15} className="text-emerald-600" />
                    : <TrendingDown size={15} className="text-red-600" />}
                  {t('Ganancia del período')}
                </span>
                <span className={`text-xl font-extrabold tabular-nums ${cashPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatPrice(cb.profit)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Información total del negocio */}
      {fullReports && (
      <div>
        <h3 className="mb-3 flex items-center gap-2 font-bold text-gray-900">
          <PiggyBank size={17} className="text-gray-400" />
          {t('Información total del negocio')}
          <span className="text-xs font-normal text-gray-400">{t('(inventario actual)')}</span>
        </h3>
        {overview.isLoading ? (
          <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-gray-400" /></div>
        ) : overview.isError ? (
          <p className="py-6 text-center text-sm text-red-500">{t('No pudimos cargar la información del negocio.')}</p>
        ) : ov && (
          <>
          {ov.productsWithoutPrice > 0 && (
            <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
              <AlertTriangle size={15} className="flex-shrink-0" />
              <span>
                {ov.productsWithoutPrice !== 1 ? (
                  <><strong>{t('{n} productos sin precio definido', { n: ov.productsWithoutPrice })}</strong> {t('no están incluidos en estos totales.')}</>
                ) : (
                  <><strong>{t('1 producto sin precio definido')}</strong> {t('no está incluido en estos totales.')}</>
                )}
              </span>
              <Link
                to="/products?variablePrice=1"
                className="font-semibold text-orange-700 underline hover:text-orange-900"
              >
                {t('Ponerles precio ahora')}
              </Link>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-3">
            <OverviewCard
              icon={Wallet}
              label={t('Capital total')}
              value={ov.capitalTotal}
              tone="blue"
              subtitle={t('{n} productos con precio definido', { n: ov.productCount })}
            />
            <OverviewCard
              icon={PackageOpen}
              label={t('Costo de productos')}
              value={ov.productCostTotal}
              tone="amber"
              subtitle={t('Stock valorizado al costo de compra')}
            />
            <OverviewCard
              icon={Number(ov.potentialProfit) >= 0 ? TrendingUp : Undo2}
              label={t('Ganancia potencial')}
              value={ov.potentialProfit}
              tone={Number(ov.potentialProfit) >= 0 ? 'emerald' : 'red'}
              subtitle={t('Si se vende todo el stock actual')}
            />
          </div>
          </>
        )}
      </div>
      )}
    </div>
  )
}
