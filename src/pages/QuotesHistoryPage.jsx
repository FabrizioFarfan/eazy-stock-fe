import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText, Search, X, CheckCircle2, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useDebounce } from '../hooks/useDebounce'
import { useQuoteSearch } from '../hooks/useQuotes'
import LoadMoreRow from '../components/common/LoadMoreRow'
import QuoteTabs from '../components/common/QuoteTabs'
import HelpDrawer from '../components/common/HelpDrawer'
import { formatPrice } from '../utils/formatMoney'
import QuoteDetailModal from '../components/quotes/QuoteDetailModal'
import { useT, dateLocale } from '../i18n'

const fmtDate = (iso) => new Date(iso).toLocaleDateString(dateLocale(), { day: '2-digit', month: 'short', year: 'numeric' })
const fmtTime = (iso) => new Date(iso).toLocaleTimeString(dateLocale(), { hour: '2-digit', minute: '2-digit' })

/**
 * Historial de cotizaciones (pedido de William): el cliente al que se le hizo
 * un presupuesto vuelve al negocio, se busca su cotización aquí y con «Vender
 * estos productos» todas las líneas pasan a una venta nueva de una sola vez.
 */
export default function QuotesHistoryPage() {
  const navigate = useNavigate()
  const t = useT()
  const { user, can } = useAuth()
  const canSell = can('canRegisterSale')

  const [query, setQuery]   = useState('')
  const [status, setStatus] = useState('')          // '' | 'OPEN' | 'CONVERTED'
  const debounced = useDebounce(query, 350)
  const search = useQuoteSearch(debounced, status ? { status } : {})
  const [openId, setOpenId] = useState(null)

  const statusChip = (s) => s === 'CONVERTED'
    ? <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700"><CheckCircle2 size={11} /> {t('Vendida')}</span>
    : <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">{t('Abierta')}</span>

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/sales')}
            className="flex flex-shrink-0 items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">{t('Volver')}</span>
          </button>
          <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">{t('Cotizaciones')}</h2>
          <HelpDrawer title={t('Tus cotizaciones guardadas')} autoOpenKey="eazystock_quote_history_help_v1">
            <p>{t('Cada cotización que generas queda aquí con su número, fecha, cliente y total.')}</p>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">{t('🔍 Encuéntrala rápido')}</p>
              <p className="mt-1">{t('Busca por nombre o teléfono del cliente, por el número (COT-0012 → 12) o por un producto que llevaba.')}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">{t('🛒 Vender estos productos')}</p>
              <p className="mt-1">{t('El cliente volvió y quiere lo cotizado: abre la cotización y pulsa «Vender estos productos». Se arma una venta nueva con todas las líneas y los precios cotizados; ahí ajustas cantidades si hace falta y cobras. Al cobrar, la cotización queda marcada como «Vendida».')}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">{t('📤 Descargar, WhatsApp, correo o imprimir')}</p>
              <p className="mt-1">{t('Sale idéntica a la original, con su número y su fecha. Descarga el PDF o mándalo por WhatsApp / correo al cliente.')}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">{t('✏️ Editar y duplicar')}</p>
              <p className="mt-1">{t('Una cotización abierta se puede editar (conserva su número). «Duplicar» arma una cotización nueva con los mismos productos a precio de hoy — sirve para re-cotizar a un cliente que vuelve, incluso desde una ya vendida.')}</p>
            </div>
          </HelpDrawer>
        </div>
        <QuoteTabs active="history" />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-md">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('Buscar por cliente, teléfono, número o producto...')}
            className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-9 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 placeholder-gray-400"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-gray-600"><X size={14} /></button>
          )}
        </div>
        <div className="flex w-full items-center gap-1 rounded-xl border border-gray-200 bg-gray-100 p-1 text-xs sm:w-auto">
          {[['', t('Todas')], ['OPEN', t('Abiertas')], ['CONVERTED', t('Vendidas')]].map(([v, label]) => (
            <button key={v} onClick={() => setStatus(v)}
              className={`flex-1 rounded-lg px-3 py-1.5 font-medium transition-colors sm:flex-none ${status === v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        {search.isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-400"><Loader2 size={16} className="animate-spin" /> {t('Cargando...')}</div>
        ) : search.items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <FileText size={36} className="text-gray-200" />
            <p className="text-sm text-gray-400">{debounced || status ? t('Sin resultados') : t('Todavía no has generado cotizaciones')}</p>
          </div>
        ) : (
          <>
          {/* Móvil: una tarjeta por cotización (la tabla no cabe en 390px) */}
          <ul className="divide-y divide-gray-50 md:hidden">
            {search.items.map((q) => (
              <li key={q.id}>
                <button type="button" onClick={() => setOpenId(q.id)} className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left active:bg-blue-50/60">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-gray-700">COT-{String(q.number).padStart(4, '0')}</span>
                      {statusChip(q.status)}
                    </div>
                    <p className="mt-1 truncate font-semibold text-gray-900">{q.customerName || <span className="font-normal text-gray-400">{t('Sin nombre')}</span>}</p>
                    <p className="text-xs text-gray-500">
                      {fmtDate(q.createdAt)} · {t('{n} producto(s)', { n: q.itemCount })}{q.customerPhone ? ` · ${q.customerPhone}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-shrink-0 flex-col items-end gap-1">
                    <span className="font-bold text-gray-900 whitespace-nowrap">{formatPrice(q.total)}</span>
                    <span className="text-[11px] text-gray-400">{q.authorName}</span>
                  </div>
                </button>
              </li>
            ))}
            <li><LoadMoreRow search={search} /></li>
          </ul>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60 text-xs uppercase tracking-widest text-gray-400">
                  <th className="px-4 py-3 text-left">{t('N.º')}</th>
                  <th className="px-4 py-3 text-left">{t('Fecha')}</th>
                  <th className="px-4 py-3 text-left">{t('Cliente')}</th>
                  <th className="px-4 py-3 text-center">{t('Productos')}</th>
                  <th className="px-4 py-3 text-right">{t('Total')}</th>
                  <th className="px-4 py-3 text-left">{t('Estado')}</th>
                  <th className="px-4 py-3 text-left">{t('Hecha por')}</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {search.items.map((q) => (
                  <tr key={q.id} onClick={() => setOpenId(q.id)}
                    className="cursor-pointer border-b border-gray-50 transition-colors hover:bg-blue-50/40">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700">COT-{String(q.number).padStart(4, '0')}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">{fmtDate(q.createdAt)} <span className="text-xs text-gray-400">{fmtTime(q.createdAt)}</span></td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{q.customerName || <span className="font-normal text-gray-400">{t('Sin nombre')}</span>}</p>
                      {q.customerPhone && <p className="text-xs text-gray-400">{q.customerPhone}</p>}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">{q.itemCount}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900 whitespace-nowrap">{formatPrice(q.total)}</td>
                    <td className="px-4 py-3">{statusChip(q.status)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{q.authorName}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={(e) => { e.stopPropagation(); setOpenId(q.id) }}
                        className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                        {t('Ver')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <LoadMoreRow search={search} />
          </div>
          </>
        )}
      </div>

      {openId && <QuoteDetailModal id={openId} user={user} canSell={canSell} onClose={() => setOpenId(null)} />}
    </div>
  )
}
