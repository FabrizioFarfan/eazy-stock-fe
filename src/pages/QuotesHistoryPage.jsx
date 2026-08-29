import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText, Printer, ShoppingCart, Trash2, Search, X, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { useDebounce } from '../hooks/useDebounce'
import { useQuoteSearch, useQuote, useDeleteQuote } from '../hooks/useQuotes'
import LoadMoreRow from '../components/common/LoadMoreRow'
import QuoteTabs from '../components/common/QuoteTabs'
import HelpDrawer from '../components/common/HelpDrawer'
import { formatPrice } from '../utils/formatMoney'
import { formatQty } from '../utils/quantity'
import { printQuote } from '../utils/printQuote'
import { useT, dateLocale } from '../i18n'

// Misma llave que NewSalePage: la venta arranca con el carrito de la cotización.
const saleDraftKey = (userId) => `eazystock_sale_draft_${userId || 'anon'}`

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
              <p className="font-semibold text-gray-800">{t('🖨️ Reimprimir')}</p>
              <p className="mt-1">{t('Sale idéntica a la original, con su número y su fecha.')}</p>
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
              className={`flex-1 rounded-lg px-3 py-1.5 font-medium transition-colors sm:flex-none ${status === v ? 'bg-white font-semibold text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
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

function QuoteDetailModal({ id, user, canSell, onClose }) {
  const t = useT()
  const navigate = useNavigate()
  const { data: q, isLoading } = useQuote(id)
  const deleteQuote = useDeleteQuote()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmReplace, setConfirmReplace] = useState(false)

  const reprint = () => {
    const ok = printQuote({
      businessName: user?.businessName,
      authorName: q.authorName,
      customer: { name: q.customerName ?? '', phone: q.customerPhone ?? '' },
      items: q.items.map((it) => ({ name: it.productName, sku: it.productSku, unit: it.unit, qty: Number(it.quantity), unitPrice: Number(it.unitPrice) })),
      notes: q.notes ?? '',
      validityDays: q.validityDays ?? 0,
      number: q.number,
      createdAt: q.createdAt,
    })
    if (!ok) toast.error(t('Tu navegador bloqueó la ventana de impresión. Habilita las ventanas emergentes.'))
  }

  // Arma el borrador de venta con TODAS las líneas y manda al POS. Si ya había
  // una venta a medias, se pregunta antes de pisarla.
  const sellAll = (force = false) => {
    if (!force) {
      try {
        const d = JSON.parse(localStorage.getItem(saleDraftKey(user?.id)))
        if (Array.isArray(d?.cart) && d.cart.length > 0) { setConfirmReplace(true); return }
      } catch { /* sin borrador */ }
    }
    const sellable = q.items.filter((it) => it.productActive)
    const skipped = q.items.length - sellable.length
    const cart = sellable.map((it) => {
      const stock = Number(it.currentStock ?? 0)
      const qty = Math.min(Number(it.quantity), stock)
      return {
        product: {
          id: it.productId, name: it.productName, sku: it.productSku, unit: it.unit,
          currentStock: stock, priceIsVariable: it.priceIsVariable, salePrice: it.currentSalePrice,
        },
        quantity: qty > 0 ? qty : 1,
        unitPrice: Number(it.unitPrice),
      }
    })
    if (cart.length === 0) { toast.error(t('Ningún producto de esta cotización sigue activo en el catálogo')); return }
    try {
      localStorage.setItem(saleDraftKey(user?.id), JSON.stringify({
        cart, notes: '', discountType: 'PERCENTAGE', discountValue: '', onCredit: false, customer: null,
        payMethod: 'Efectivo', payOther: '', fromQuote: { id: q.id, number: q.number }, savedAt: Date.now(),
      }))
    } catch { toast.error(t('No se pudo preparar la venta (almacenamiento del navegador bloqueado)')); return }
    if (skipped > 0) toast.warning(t('{n} producto(s) ya no están en el catálogo y no se pasaron a la venta', { n: skipped }))
    const short = sellable.filter((it) => Number(it.currentStock ?? 0) < Number(it.quantity)).length
    if (short > 0) toast.warning(t('{n} producto(s) tienen menos stock que lo cotizado — la cantidad se ajustó al disponible', { n: short }))
    navigate('/sales/new')
  }

  const remove = async () => {
    try { await deleteQuote.mutateAsync(q.id); toast.success(t('Cotización borrada')); onClose() }
    catch { toast.error(t('No se pudo borrar la cotización')) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div className="relative flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        {isLoading || !q ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-400"><Loader2 size={16} className="animate-spin" /> {t('Cargando...')}</div>
        ) : (
          <>
            <div className="flex flex-shrink-0 items-start justify-between gap-3 border-b border-gray-100 px-5 py-4 sm:px-6">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold text-gray-900">{t('Cotización')} COT-{String(q.number).padStart(4, '0')}</h3>
                  {q.status === 'CONVERTED'
                    ? <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700"><CheckCircle2 size={11} /> {t('Vendida')}</span>
                    : <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">{t('Abierta')}</span>}
                </div>
                <p className="mt-0.5 text-xs text-gray-500">
                  {fmtDate(q.createdAt)} {fmtTime(q.createdAt)} · {t('hecha por')} {q.authorName}
                  {q.validityDays > 0 && <> · {t('válida {n} días', { n: q.validityDays })}</>}
                </p>
                <p className="mt-1 text-sm text-gray-800">
                  <span className="font-semibold">{q.customerName || t('Cliente sin nombre')}</span>
                  {q.customerPhone && <span className="text-gray-500"> · {q.customerPhone}</span>}
                </p>
              </div>
              <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600" aria-label={t('Cerrar')}><X size={18} /></button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {/* Móvil: líneas apiladas */}
              <ul className="divide-y divide-gray-50 sm:hidden">
                {q.items.map((it) => {
                  const short = Number(it.currentStock ?? 0) < Number(it.quantity)
                  return (
                    <li key={it.id} className="px-5 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900">{it.productName}</p>
                          <p className="font-mono text-xs text-gray-400">{it.productSku}</p>
                          {!it.productActive && <p className="text-xs font-semibold text-red-500">{t('ya no está en el catálogo')}</p>}
                        </div>
                        <span className="flex-shrink-0 font-semibold text-gray-900 whitespace-nowrap">{formatPrice(it.subtotal)}</span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
                        <span>{formatQty(it.quantity)} {it.unit} × {formatPrice(it.unitPrice)}</span>
                        <span className={short ? 'font-semibold text-amber-600' : 'text-gray-400'}>
                          {short && <AlertTriangle size={11} className="mr-0.5 inline" />}{t('Stock hoy')}: {formatQty(it.currentStock ?? 0)}
                        </span>
                      </div>
                    </li>
                  )
                })}
              </ul>
              <table className="hidden w-full text-sm sm:table">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60 text-xs uppercase tracking-widest text-gray-400">
                    <th className="px-5 py-2.5 text-left sm:px-6">{t('Producto')}</th>
                    <th className="px-3 py-2.5 text-center">{t('Cantidad')}</th>
                    <th className="px-3 py-2.5 text-right">{t('Precio unit.')}</th>
                    <th className="px-3 py-2.5 text-right">{t('Subtotal')}</th>
                    <th className="px-5 py-2.5 text-right sm:px-6">{t('Stock hoy')}</th>
                  </tr>
                </thead>
                <tbody>
                  {q.items.map((it) => {
                    const short = Number(it.currentStock ?? 0) < Number(it.quantity)
                    return (
                      <tr key={it.id} className="border-b border-gray-50">
                        <td className="px-5 py-2.5 sm:px-6">
                          <p className="font-semibold text-gray-900">{it.productName}</p>
                          <p className="font-mono text-xs text-gray-400">{it.productSku}{!it.productActive && <span className="ml-2 font-sans font-semibold text-red-500">{t('ya no está en el catálogo')}</span>}</p>
                        </td>
                        <td className="px-3 py-2.5 text-center text-gray-700">{formatQty(it.quantity)} {it.unit}</td>
                        <td className="px-3 py-2.5 text-right text-gray-700 whitespace-nowrap">{formatPrice(it.unitPrice)}</td>
                        <td className="px-3 py-2.5 text-right font-semibold text-gray-900 whitespace-nowrap">{formatPrice(it.subtotal)}</td>
                        <td className={`px-5 py-2.5 text-right whitespace-nowrap sm:px-6 ${short ? 'text-amber-600 font-semibold' : 'text-gray-500'}`}>
                          {short && <AlertTriangle size={12} className="mr-1 inline" />}{formatQty(it.currentStock ?? 0)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {q.notes && (
                <div className="px-5 py-3 text-sm text-gray-600 sm:px-6"><span className="text-xs font-semibold uppercase tracking-widest text-gray-400">{t('Notas')}</span><p className="mt-1 whitespace-pre-wrap">{q.notes}</p></div>
              )}
            </div>

            <div className="flex flex-shrink-0 flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex items-baseline justify-between gap-3 sm:block">
                <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">{t('Total')}</span>
                <p className="text-2xl font-extrabold text-gray-900">{formatPrice(q.total)}</p>
              </div>
              <div className="grid grid-cols-[auto_1fr] gap-2 sm:flex sm:flex-wrap sm:items-center">
                {confirmDelete ? (
                  <>
                    <span className="text-xs text-gray-500">{t('¿Borrar esta cotización?')}</span>
                    <button onClick={remove} disabled={deleteQuote.isPending} className="rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50">{t('Sí, borrar')}</button>
                    <button onClick={() => setConfirmDelete(false)} className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50">{t('No')}</button>
                  </>
                ) : (
                  <>
                    {canSell ? (
                      <button onClick={() => setConfirmDelete(true)} title={t('Borrar')}
                        className="flex items-center justify-center rounded-xl border border-gray-200 px-3 py-2.5 text-gray-400 hover:bg-red-50 hover:text-red-500"><Trash2 size={15} /></button>
                    ) : <span className="hidden sm:block" />}
                    <button onClick={reprint}
                      className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                      <Printer size={15} /> {t('Imprimir')}
                    </button>
                    {canSell && q.status !== 'CONVERTED' && (
                      <button onClick={() => sellAll(false)}
                        className="col-span-2 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 sm:col-span-1 sm:py-2.5">
                        <ShoppingCart size={15} /> {t('Vender estos productos')}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {confirmReplace && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-orange-100"><AlertTriangle size={18} className="text-orange-600" /></div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">{t('Ya tienes una venta a medias')}</h3>
                  <p className="mt-1 text-sm text-gray-500">{t('Si sigues, esa venta se reemplaza por los productos de esta cotización.')}</p>
                </div>
              </div>
              <div className="mt-5 flex flex-col gap-2">
                <button onClick={() => { setConfirmReplace(false); sellAll(true) }} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">{t('Reemplazar y vender esta cotización')}</button>
                <button onClick={() => setConfirmReplace(false)} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">{t('Cancelar')}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
