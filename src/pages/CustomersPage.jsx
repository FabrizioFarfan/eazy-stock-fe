import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Users, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react'
import PageTitle from '../components/common/PageTitle'
import { useDebounce } from '../hooks/useDebounce'
import { useCustomers } from '../hooks/useCustomers'
import { useAuth } from '../context/AuthContext'
import CustomerFormModal from '../components/customers/CustomerFormModal'
import { formatPrice } from '../utils/formatMoney'
import HelpDrawer from '../components/common/HelpDrawer'
import { useT } from '../i18n'

const PAGE_SIZE = 20

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

  const items         = data?.content       ?? []
  const totalElements = data?.totalElements ?? 0
  const totalPages    = data?.totalPages    ?? 0
  const fromRow       = totalElements === 0 ? 0 : page * PAGE_SIZE + 1
  const toRow         = Math.min((page + 1) * PAGE_SIZE, totalElements)

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PageTitle icon={Users} tone="purple">{t('Clientes')}</PageTitle>
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
          {!isLoading && (
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700">
              {totalElements}
            </span>
          )}
        </div>
        {canManage && (
          <button onClick={() => setEditing('new')}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 hover:bg-blue-700 transition-all active:scale-[0.98]">
            <Plus size={15} />{t('Nuevo cliente')}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" placeholder={t('Buscar por nombre, documento o teléfono...')}
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(0) }}
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" checked={withDebt}
            onChange={(e) => { setWithDebt(e.target.checked); setPage(0) }}
            className="accent-blue-600" />
          {t('Solo con deuda')}
        </label>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
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
                    <td className="px-5 py-3.5 text-gray-600">{c.phone || '—'}</td>
                    <td className="px-5 py-3.5 text-right font-bold text-gray-900">{formatPrice(c.currentDebt)}</td>
                    <td className="px-5 py-3.5 text-center"><DebtBadge debt={c.currentDebt} limit={c.creditLimit} /></td>
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
