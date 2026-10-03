import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { HandCoins, Truck, ChevronLeft, ChevronRight, ArrowRight, Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import {
  useCustomerPayments, useCustomerPaymentsSummary, useSupplierPayments, useSupplierPaymentsSummary,
} from '../../hooks/useMoneyMovements'
import { formatPrice } from '../../utils/formatMoney'
import { useT, dateLocale } from '../../i18n'

/**
 * Movimientos de PLATA que no mueven stock (William, 3-oct-2026): cobros de
 * fiado y pagos a proveedores. Viven junto a los movimientos de mercadería en
 * Stock › Movimientos y como historial en Cuentas por cobrar / por pagar.
 */
const MONEY_KINDS = {
  COBRO: {
    label: 'Cobro de fiado', plural: 'Cobros de fiado', who: 'Cliente', icon: HandCoins,
    chip: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100', amount: 'text-emerald-600', sign: '+',
    iconBox: 'bg-emerald-50 text-emerald-600', empty: 'No hay cobros de fiado en este período',
    route: (id) => `/customers/${id}`, nameOf: (m) => m.customerName, idOf: (m) => m.customerId,
  },
  PAGO: {
    label: 'Pago a proveedor', plural: 'Pagos a proveedor', who: 'Proveedor', icon: Truck,
    chip: 'bg-rose-50 text-rose-700 ring-1 ring-rose-100', amount: 'text-rose-600', sign: '−',
    iconBox: 'bg-rose-50 text-rose-600', empty: 'No hay pagos a proveedores en este período',
    route: (id) => `/suppliers/${id}`, nameOf: (m) => m.supplierName, idOf: (m) => m.supplierId,
  },
}

function formatDateTime(str) {
  if (!str) return '—'
  return new Intl.DateTimeFormat(dateLocale(), { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(str))
}

// Parámetros comunes: rango + negocio del admin de plataforma.
function useScope(from, to) {
  const { user } = useAuth()
  return {
    ...(from && { from }), ...(to && { to }),
    ...(user?.role === 'SUPER_ADMIN' && user?.businessId && { businessId: user.businessId }),
  }
}

function useSummary(kind, from, to, options) {
  const scope = useScope(from, to)
  const cobros = useCustomerPaymentsSummary(scope, { ...options, enabled: kind === 'COBRO' && (options?.enabled ?? true) })
  const pagos  = useSupplierPaymentsSummary(scope, { ...options, enabled: kind === 'PAGO' && (options?.enabled ?? true) })
  return kind === 'COBRO' ? cobros : pagos
}

const thCls = 'px-4 py-3.5 text-xs font-semibold uppercase tracking-widest text-gray-400'
const PAGE_SIZE = 20

/** Tabla (PC) / tarjetas (celular) de cobros o pagos en un rango, con paginación y total del período. */
export function MoneyMovementsTable({ kind, from, to }) {
  const t = useT()
  const cfg = MONEY_KINDS[kind]
  const Icon = cfg.icon
  const [page, setPage] = useState(0)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setPage(0) }, [kind, from, to])

  const scope = useScope(from, to)
  const params = { ...scope, page, size: PAGE_SIZE }
  const cobros = useCustomerPayments(params, { enabled: kind === 'COBRO' })
  const pagos  = useSupplierPayments(params, { enabled: kind === 'PAGO' })
  const { data, isLoading, isFetching } = kind === 'COBRO' ? cobros : pagos
  const { data: summary } = useSummary(kind, from, to)

  const rows          = data?.content       ?? []
  const totalElements = data?.totalElements ?? 0
  const totalPages    = data?.totalPages    ?? 0
  const fromRow       = totalElements === 0 ? 0 : page * PAGE_SIZE + 1
  const toRow         = Math.min((page + 1) * PAGE_SIZE, totalElements)

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      {/* Total del período: lo suma el servidor sobre todo el rango, no solo la página */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-gray-100 px-4 py-3.5 sm:px-5">
        <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${cfg.iconBox}`}><Icon size={17} /></span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-gray-900">{t(cfg.plural)}</h3>
          <p className="text-xs text-gray-500">
            {summary
              ? t('{n} en el período · {total} en total · {m} {who}', { n: summary.count, total: formatPrice(summary.total), m: summary.counterparties, who: summary.counterparties === 1 ? t(cfg.who).toLowerCase() : t(cfg.who === 'Cliente' ? 'clientes' : 'proveedores') })
              : t('Toca el nombre para abrir su ficha y ver toda su cuenta.')}
          </p>
        </div>
        {summary && <p className={`text-xl font-extrabold ${cfg.amount}`}>{cfg.sign}{formatPrice(summary.total)}</p>}
      </div>

      {/* Celular */}
      <div className="md:hidden">
        {isLoading ? (
          <div className="py-10 text-center"><Loader2 size={20} className="mx-auto animate-spin text-gray-400" /></div>
        ) : rows.length === 0 ? (
          <p className="px-5 py-14 text-center text-sm font-medium text-gray-400">{t(cfg.empty)}</p>
        ) : (
          <ul className={`divide-y divide-gray-100 ${isFetching ? 'opacity-60' : ''}`}>
            {rows.map((m) => (
              <li key={m.id} className="flex items-start gap-3 px-4 py-3.5">
                <div className="min-w-0 flex-1">
                  <Link to={cfg.route(cfg.idOf(m))} className="line-clamp-2 break-words text-sm font-semibold leading-snug text-gray-900 hover:text-blue-600">
                    {cfg.nameOf(m) ?? '—'}
                  </Link>
                  <p className="mt-0.5 text-xs text-gray-400">{formatDateTime(m.createdAt)}{m.createdByName && <> · {m.createdByName}</>}</p>
                  {m.notes && <p className="mt-0.5 truncate text-xs text-gray-500">{m.notes}</p>}
                  <span className={`mt-1.5 inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.chip}`}>{t(cfg.label)}</span>
                </div>
                <div className="flex flex-shrink-0 flex-col items-end">
                  <span className={`text-base font-bold ${cfg.amount}`}>{cfg.sign}{formatPrice(m.amount)}</span>
                  <span className="text-[11px] text-gray-400">{t('Saldo')}: {formatPrice(m.balanceAfter)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* PC */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              <th className={`${thCls} text-left whitespace-nowrap`}>{t('Fecha')}</th>
              <th className={`${thCls} text-left`}>{t(cfg.who)}</th>
              <th className={`${thCls} text-center`}>{t('Tipo')}</th>
              <th className={`${thCls} text-right`}>{t('Monto')}</th>
              <th className={`${thCls} text-right whitespace-nowrap`} title={t('Lo que quedó debiendo después de este movimiento')}>{t('Saldo después')}</th>
              <th className={`${thCls} text-left`}>{t('Registró')}</th>
              <th className={`${thCls} text-left`}>{t('Nota')}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="py-10 text-center"><Loader2 size={20} className="mx-auto animate-spin text-gray-400" /></td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={7} className="py-14 text-center text-sm font-medium text-gray-400">{t(cfg.empty)}</td></tr>
            ) : rows.map((m) => (
              <tr key={m.id} className={`border-b border-gray-50 transition-colors hover:bg-gray-50 ${isFetching ? 'opacity-60' : ''}`}>
                <td className="whitespace-nowrap px-4 py-3.5 text-xs text-gray-500">{formatDateTime(m.createdAt)}</td>
                <td className="max-w-[220px] truncate px-4 py-3.5 font-semibold text-gray-900">
                  <Link to={cfg.route(cfg.idOf(m))} className="hover:text-blue-600 hover:underline" title={t('Abrir su ficha')}>{cfg.nameOf(m) ?? '—'}</Link>
                </td>
                <td className="px-4 py-3.5 text-center">
                  <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.chip}`}>{t(cfg.label)}</span>
                </td>
                <td className={`whitespace-nowrap px-4 py-3.5 text-right font-bold ${cfg.amount}`}>{cfg.sign}{formatPrice(m.amount)}</td>
                <td className="whitespace-nowrap px-4 py-3.5 text-right font-mono text-xs text-gray-600">{formatPrice(m.balanceAfter)}</td>
                <td className="px-4 py-3.5 text-xs text-gray-600">{m.createdByName ?? '—'}</td>
                <td className="max-w-[220px] truncate px-4 py-3.5 text-xs text-gray-500" title={m.notes ?? ''}>{m.notes || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 px-4 py-3.5 sm:px-5">
          <p className="text-sm text-gray-400">
            <span className="font-semibold text-gray-700">{fromRow}–{toRow}</span> {t('de')}{' '}
            <span className="font-semibold text-gray-700">{totalElements}</span>
          </p>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
              className="flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40">
              <ChevronLeft size={14} />{t('Anterior')}
            </button>
            <span className="px-3 text-sm font-medium text-gray-500">{page + 1} / {totalPages}</span>
            <button type="button" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40">
              {t('Siguiente')}<ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function StripCard({ kind, from, to, onPick }) {
  const t = useT()
  const cfg = MONEY_KINDS[kind]
  const Icon = cfg.icon
  const { data, isLoading } = useSummary(kind, from, to)
  const n = data?.count ?? 0
  return (
    <button type="button" onClick={() => onPick(kind)}
      className="group flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3.5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
      <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${cfg.iconBox}`}><Icon size={20} /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-gray-900">{t(cfg.plural)}</span>
        <span className="block truncate text-xs text-gray-500">
          {isLoading ? '…' : n === 0 ? t('Ninguno en este período') : t('{n} · {total}', { n, total: formatPrice(data.total) })}
        </span>
      </span>
      <span className="flex flex-shrink-0 items-center gap-1 text-xs font-semibold text-blue-600">
        {t('Ver')} <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
      </span>
    </button>
  )
}

/** Franja sobre el historial de mercadería: la plata que entró y salió en el mismo rango, a un toque. */
export function MoneyStrip({ from, to, onPick, showPago }) {
  return (
    <div className={`grid grid-cols-1 gap-3 ${showPago ? 'sm:grid-cols-2' : ''}`}>
      <StripCard kind="COBRO" from={from} to={to} onPick={onPick} />
      {showPago && <StripCard kind="PAGO" from={from} to={to} onPick={onPick} />}
    </div>
  )
}
