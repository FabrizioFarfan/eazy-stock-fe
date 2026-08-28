import { useState } from 'react'
import { ChevronLeft, ChevronRight, PackagePlus, Loader2, Search, AlertTriangle } from 'lucide-react'
import { useReceipts } from '../../hooks/useReceipts'
import { useSuppliers } from '../../hooks/useSuppliers'
import { useDebounce } from '../../hooks/useDebounce'
import { formatPrice } from '../../utils/formatMoney'
import ReceiptDetailModal from './ReceiptDetailModal'
import { useT, dateLocale } from '../../i18n'

function formatDate(str) {
  if (!str) return '—'
  return new Intl.DateTimeFormat(dateLocale(), {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(str))
}

const PAGE_SIZE = 20

export default function ReceiptsTab() {
  const t = useT()
  const [page, setPage]                 = useState(0)
  const [supplierId, setSupplierId]     = useState('')
  const [from, setFrom]                 = useState('')
  const [to, setTo]                     = useState('')
  const [reference, setReference]       = useState('')
  const [paymentMode, setPaymentMode]   = useState('')
  const [selectedReceiptId, setSelectedReceiptId] = useState(null)
  const debouncedReference = useDebounce(reference, 350)

  const { data: suppliersData } = useSuppliers({ size: 200 })
  const suppliers = suppliersData?.content ?? []

  const hasFilters = !!(supplierId || from || to || reference || paymentMode)

  // Fechas planas yyyy-MM-dd: el BE las interpreta como día en la zona del
  // usuario (ClientDay). El `T00:00:00` viejo era hora del SERVER (Berlín) y
  // por eso filtrar por fechas vaciaba la lista (reporte de William).
  const params = {
    page, size: PAGE_SIZE,
    ...(supplierId && { supplierId }),
    ...(from && { from }),
    ...(to   && { to }),
    ...(debouncedReference.trim() && { reference: debouncedReference.trim() }),
    ...(paymentMode && { paymentMode }),
  }

  const { data, isLoading, isFetching, isError } = useReceipts(params)
  const items         = data?.content       ?? []
  const totalElements = data?.totalElements ?? 0
  const totalPages    = data?.totalPages    ?? 0
  const fromRow       = totalElements === 0 ? 0 : page * PAGE_SIZE + 1
  const toRow         = Math.min((page + 1) * PAGE_SIZE, totalElements)

  const selectCls = 'rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'

  return (
    <div className="flex flex-col gap-4">

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
        <select value={supplierId} onChange={(e) => { setSupplierId(e.target.value); setPage(0) }}
          className={`${selectCls} min-w-48`}>
          <option value="">{t('Todos los proveedores')}</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-500">{t('Desde')}</span>
          <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(0) }}
            className={selectCls} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-500">{t('Hasta')}</span>
          <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(0) }}
            className={selectCls} />
        </div>

        {/* Nº de factura/guía: para eso se pide al registrar (pedido de William) */}
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={reference}
            onChange={(e) => { setReference(e.target.value); setPage(0) }}
            placeholder={t('Nº de factura / guía...')}
            className={`${selectCls} pl-8 min-w-44`}
          />
        </div>

        <select value={paymentMode} onChange={(e) => { setPaymentMode(e.target.value); setPage(0) }}
          className={selectCls}>
          <option value="">{t('Contado y crédito')}</option>
          <option value="CASH">{t('Al contado')}</option>
          <option value="CREDIT">{t('A crédito')}</option>
        </select>

        {hasFilters && (
          <button onClick={() => { setSupplierId(''); setFrom(''); setTo(''); setReference(''); setPaymentMode(''); setPage(0) }}
            className="text-sm font-medium text-blue-600 hover:text-blue-700">
            {t('Limpiar')}
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">{t('Fecha')}</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">{t('Proveedor')}</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">{t('Factura/Guía')}</th>
                <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-widest text-gray-400">{t('# Productos')}</th>
                <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-widest text-gray-400">{t('Modalidad')}</th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-widest text-gray-400">{t('Total')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="py-10 text-center"><Loader2 size={20} className="mx-auto animate-spin text-gray-400" /></td></tr>
              ) : isError ? (
                // Un error NO es "no tienes recepciones": decir la verdad.
                <tr>
                  <td colSpan={6}>
                    <div className="flex flex-col items-center gap-3 py-16">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50">
                        <AlertTriangle size={28} className="text-amber-600" />
                      </div>
                      <p className="text-sm font-semibold text-gray-700">{t('No pudimos cargar las recepciones')}</p>
                      <p className="text-xs text-gray-400">{t('Revisá tu conexión y volvé a intentar.')}</p>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="flex flex-col items-center gap-3 py-16">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
                        <PackagePlus size={28} className="text-gray-400" />
                      </div>
                      {hasFilters ? (
                        <>
                          <p className="text-sm font-semibold text-gray-700">{t('Sin recepciones con estos filtros')}</p>
                          <p className="text-xs text-gray-400">{t('Probá ampliar las fechas o tocá "Limpiar".')}</p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-semibold text-gray-700">{t('Aún no registraste recepciones')}</p>
                          <p className="text-xs text-gray-400">{t('Hacé click en "Registrar recepción" arriba.')}</p>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((r) => (
                  <tr key={r.id}
                    onClick={() => setSelectedReceiptId(r.id)}
                    className={`cursor-pointer border-b border-gray-50 transition-colors hover:bg-blue-50/30 ${isFetching ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-3.5 whitespace-nowrap text-xs text-gray-500">{formatDate(r.createdAt)}</td>
                    <td className="px-4 py-3.5 font-semibold text-gray-900">{r.supplierName}</td>
                    <td className="px-4 py-3.5 font-mono text-xs text-gray-500">{r.referenceDocument ?? '—'}</td>
                    <td className="px-4 py-3.5 text-center font-mono text-gray-700">{r.movements?.length ?? 0}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        r.paymentMode === 'CREDIT'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {r.paymentMode === 'CREDIT' ? t('Crédito') : t('Contado')}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-gray-900">{formatPrice(r.totalAmount)}</td>
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
              <span className="font-semibold text-gray-700">{totalElements}</span> {t('recepciones')}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                className="flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                <ChevronLeft size={14} />{t('Anterior')}
              </button>
              <span className="px-3 text-sm font-medium text-gray-500">{page + 1} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                {t('Siguiente')}<ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedReceiptId && (
        <ReceiptDetailModal
          receiptId={selectedReceiptId}
          onClose={() => setSelectedReceiptId(null)}
        />
      )}
    </div>
  )
}
