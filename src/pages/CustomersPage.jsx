import { formatPhoneDisplay } from '../utils/phone'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Users, ChevronLeft, ChevronRight, AlertTriangle, ArrowRight, Wallet, Award, X } from 'lucide-react'
import { AccountsSwitcher, ReportHero, ReportHeader } from '../components/reports/ReportKit'
import { useReceivables } from '../hooks/useReports'
import { useDebounce } from '../hooks/useDebounce'
import { useCustomers } from '../hooks/useCustomers'
import { useAuth } from '../context/AuthContext'
import CustomerFormModal from '../components/customers/CustomerFormModal'
import { formatPrice } from '../utils/formatMoney'
import HelpDrawer from '../components/common/HelpDrawer'
import { useT } from '../i18n'

const PAGE_SIZE = 20

// Acceso grande (mismo que Dashboard / Productos / Ventas).
function Tile({ icon: Icon, label, hint, onClick, primary, className = '' }) {
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

function DebtBadge({ debt, limit }) {
  const t = useT()
  const value = Number(debt ?? 0)
  if (value <= 0) {
    return <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">{t('Sin deuda')}</span>
  }
  if (limit != null && Number(limit) > 0 && value > Number(limit)) {
    return <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-red-100">
      <AlertTriangle size={11} /> {t('Excede límite')}
    </span>
  }
  return <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-100">{t('Debe')}</span>
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

export default function CustomersPage() {
  const navigate = useNavigate()
  const t = useT()
  const { user, can } = useAuth()
  const canManage = can('canManageCustomers')

  const [page, setPage]               = useState(0)
  const [search, setSearch]           = useState('')
  const [withDebt, setWithDebt]       = useState(false)
  const [editing, setEditing]         = useState(null)  // null | 'new' | customer object

  const debouncedSearch = useDebounce(search, 350)

  const params = {
    page,
    size: PAGE_SIZE,
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(withDebt && { withDebt: true }),
    ...(user?.role === 'SUPER_ADMIN' && user?.businessId && { businessId: user.businessId }),
  }
  const { data, isLoading, isFetching } = useCustomers(params)

  // Cifras de la franja: todos los clientes, cuántos deben y cuánto (el total
  // por cobrar solo lo ve quien ve reportes).
  const scope = user?.role === 'SUPER_ADMIN' && user?.businessId ? { businessId: user.businessId } : {}
  const { data: allC }  = useCustomers({ page: 0, size: 1, ...scope })
  const { data: debtC } = useCustomers({ page: 0, size: 1, withDebt: true, ...scope })
  const canReports = can('canViewReports')
  const { data: recv }  = useReceivables(Object.keys(scope).length ? scope : undefined, { enabled: canReports })

  const items         = data?.content       ?? []
  const totalElements = data?.totalElements ?? 0
  const totalPages    = data?.totalPages    ?? 0
  const fromRow       = totalElements === 0 ? 0 : page * PAGE_SIZE + 1
  const toRow         = Math.min((page + 1) * PAGE_SIZE, totalElements)

  return (
    <div className="flex flex-col gap-5">
      <ReportHeader icon={Users} title={t('Clientes')}
        subtitle={t('A quién le vendes, quién te debe y cuánto')}
        help={(
          <HelpDrawer title={t('Cómo usar Clientes')} autoOpenKey="eazystock_customers_help_v2">
            <p>{t('Registra a tus clientes para poder venderles al fiado y llevar su cuenta al día.')}</p>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">👆 {t('Click en un cliente')}</p>
              <p className="mt-1">{t('Ves su estado de cuenta completo: deuda actual, límite de crédito, % del límite usado e historial de cargos, pagos y ajustes. Desde ahí registras pagos.')}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">💰 {t('¿Cómo se genera la deuda (fiado)?')}</p>
              <p className="mt-1">{t('Al hacer una venta al fiado en "Nueva venta", eliges el cliente y la deuda se anota sola en su cuenta. Solo puede fiar quien tenga el permiso "Vender al fiado", y el límite de crédito de cada cliente frena las ventas que lo superen (límite 0 = no se le fía).')}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">📄 {t('Estado de cuenta en PDF')}</p>
              <p className="mt-1">{t('En la ficha del cliente, el botón "PDF de deuda" genera una carta cordial con el detalle producto por producto de lo que compró al fiado, los pagos que ya hizo y el saldo pendiente. Ideal para entregarla en mano o enviarla por correo.')}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">💬 {t('Recordatorio por WhatsApp')}</p>
              <p className="mt-1">{t('Si el cliente tiene teléfono guardado, el botón verde "WhatsApp" abre su chat con un mensaje de recordatorio ya escrito con el saldo que debe. Mándalo y, si quieres, adjunta el PDF en el mismo chat.')}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">✅ {t('Cuando te pague')}</p>
              <p className="mt-1">{t('Usa "Registrar pago" con el monto recibido: la deuda baja al instante y queda asentada en el historial. Con "Ajustar deuda" corriges saldos (siempre con un motivo que queda registrado).')}</p>
            </div>
            <p className="text-xs text-gray-400">{t('Tip: el total que te deben todos tus clientes lo ves junto en Cuentas → Por cobrar. Marca "Solo con deuda" para ver únicamente a quienes te deben.')}</p>
          </HelpDrawer>
        )} />

      <AccountsSwitcher />

      {/* Franja + accesos grandes */}
      <div className={`grid grid-cols-1 gap-4 ${canManage || canReports ? 'lg:grid-cols-3' : ''}`}>
        <div className={canManage || canReports ? 'lg:col-span-2' : ''}>
          <ReportHero icon={Users} label={t('Tus clientes')} loading={allC == null}
            value={allC?.totalElements ?? 0}
            cells={[
              [t('Con deuda'), debtC?.totalElements ?? 0, Number(debtC?.totalElements) > 0 ? 'text-amber-200' : ''],
              ...(canReports ? [[t('Te deben'), formatPrice(recv?.totalReceivable ?? 0)]] : []),
              [t('Al día'), Math.max(0, (allC?.totalElements ?? 0) - (debtC?.totalElements ?? 0))],
            ]} />
        </div>
        {(canManage || canReports) && <div className="grid grid-cols-2 gap-3 lg:grid-cols-1 lg:content-start">
          {canManage && (
            <Tile primary icon={Plus} label={t('Nuevo cliente')} hint={t('Para venderle al fiado y saber qué compra')}
              onClick={() => setEditing('new')} className="col-span-2 lg:col-span-1" />
          )}
          {canReports && (
            <Tile icon={Wallet} label={t('Cuentas x cobrar')} hint={t('Lo que te deben')} onClick={() => navigate('/reports/receivables')} />
          )}
          {canReports && (
            <Tile icon={Award} label={t('Análisis de clientes')} hint={t('Quién te compra más')} onClick={() => navigate('/reports/customers')} />
          )}
        </div>}
      </div>

      {/* Buscador grande + atajos */}
      <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm sm:p-4">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" placeholder={t('Buscar por nombre, documento o teléfono...')}
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(0) }}
            className="w-full rounded-xl border border-gray-200 bg-gray-50/60 py-3 pl-11 pr-10 text-base text-gray-900 outline-none transition-colors focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/20"
          />
          {search && (
            <button type="button" onClick={() => { setSearch(''); setPage(0) }} title={t('Limpiar')}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700">
              <X size={15} />
            </button>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {[[false, t('Todos'), allC?.totalElements], [true, t('Con deuda'), debtC?.totalElements]].map(([val, label, n]) => (
            <button key={String(val)} type="button" onClick={() => { setWithDebt(val); setPage(0) }} aria-pressed={withDebt === val}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-all ${
                withDebt === val
                  ? 'border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}>
              {label}
              {n != null && <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${withDebt === val ? 'bg-white/20' : 'bg-gray-100 text-gray-600'}`}>{n}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="md:hidden">
          {isLoading ? (
            <div className="space-y-3 p-4">{[1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-100" />)}</div>
          ) : items.length === 0 ? (
            <p className="px-5 py-14 text-center text-sm font-semibold text-gray-500">
              {search || withDebt ? t('No hay clientes con estos filtros') : t('Aún no tenés clientes')}
            </p>
          ) : (
            <ul className={`divide-y divide-gray-100 ${isFetching ? 'opacity-60' : ''}`}>
              {items.map((c) => (
                <li key={c.id}>
                  <button type="button" onClick={() => navigate(`/customers/${c.id}`)}
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-blue-50/40">
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700">
                      {c.name?.trim()?.[0]?.toUpperCase() ?? '?'}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block break-words text-sm font-semibold text-gray-900">{c.name}</span>
                      <span className="block truncate text-xs text-gray-400">{formatPhoneDisplay(c.phone) || c.documentId || '—'}</span>
                    </span>
                    <span className="flex flex-shrink-0 flex-col items-end gap-1">
                      <span className="text-sm font-bold text-gray-900">{formatPrice(c.currentDebt)}</span>
                      <DebtBadge debt={c.currentDebt} limit={c.creditLimit} />
                    </span>
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
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">{t('Nombre')}</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">{t('Documento')}</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">{t('Teléfono')}</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-widest text-gray-400">{t('Deuda actual')}</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-widest text-gray-400">{t('Estado')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="flex flex-col items-center gap-4 py-16">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
                        <Users size={28} className="text-gray-400" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-gray-700">
                          {search || withDebt ? t('No hay clientes con estos filtros') : t('Aún no tenés clientes')}
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          {t('Creá clientes para vender al fiado y registrar pagos.')}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((c) => (
                  <tr key={c.id}
                    className={`cursor-pointer border-b border-gray-50 transition-colors hover:bg-blue-50/40 ${isFetching ? 'opacity-60' : ''}`}
                    onClick={() => navigate(`/customers/${c.id}`)}
                  >
                    <td className="px-5 py-3.5 font-semibold text-gray-900">{c.name}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-500">{c.documentId || '—'}</td>
                    <td className="px-5 py-3.5 text-gray-600">{formatPhoneDisplay(c.phone) || '—'}</td>
                    <td className="px-5 py-3.5 text-right font-bold text-gray-900">{formatPrice(c.currentDebt)}</td>
                    <td className="px-5 py-3.5 text-center"><DebtBadge debt={c.currentDebt} limit={c.creditLimit} /></td>
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
              <span className="font-semibold text-gray-700">{totalElements}</span> {t('clientes')}
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

      {editing === 'new' && (
        <CustomerFormModal customer={null} onClose={() => setEditing(null)} />
      )}
    </div>
  )
}
