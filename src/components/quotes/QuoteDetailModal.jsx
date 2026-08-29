import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingCart, Trash2, X, CheckCircle2, AlertTriangle, Loader2, PencilLine, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { useQuote, useDeleteQuote } from '../../hooks/useQuotes'
import { formatPrice } from '../../utils/formatMoney'
import { formatQty } from '../../utils/quantity'
import QuoteActions from './QuoteActions'
import { quoteDraftKey } from '../../utils/quoteDraft'
import { useT, dateLocale } from '../../i18n'

// Misma llave que NewSalePage: la venta arranca con el carrito de la cotización.
const saleDraftKey = (userId) => `eazystock_sale_draft_${userId || 'anon'}`

const fmtDate = (iso) => new Date(iso).toLocaleDateString(dateLocale(), { day: '2-digit', month: 'short', year: 'numeric' })
const fmtTime = (iso) => new Date(iso).toLocaleTimeString(dateLocale(), { hour: '2-digit', minute: '2-digit' })

/**
 * Detalle de una cotización con todas sus salidas (PDF, WhatsApp, correo,
 * imprimir) y acciones (duplicar, editar si está abierta, vender, borrar).
 * Lo abren el historial de cotizaciones y la ficha del cliente.
 */
export default function QuoteDetailModal({ id, user, canSell, onClose }) {
  const t = useT()
  const navigate = useNavigate()
  const { data: q, isLoading } = useQuote(id)
  const deleteQuote = useDeleteQuote()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmReplace, setConfirmReplace] = useState(false)

  const printable = () => ({
    businessName: user?.businessName,
    authorName: q.authorName,
    customer: { name: q.customerName ?? '', phone: q.customerPhone ?? '', email: q.customerEmail ?? '' },
    items: q.items.map((it) => ({ name: it.productName, sku: it.productSku, unit: it.unit, qty: Number(it.quantity), unitPrice: Number(it.unitPrice) })),
    notes: q.notes ?? '',
    validityDays: q.validityDays ?? 0,
    number: q.number,
    createdAt: q.createdAt,
  })

  // Duplicar: cotización NUEVA (número nuevo) con los mismos productos a precio
  // de HOY (los cotizados pueden estar viejos) y el mismo cliente; se abre en
  // «Nueva cotización» para ajustar. Vale también para una ya vendida.
  const duplicate = (force = false) => {
    if (!force) {
      try {
        const d = JSON.parse(localStorage.getItem(quoteDraftKey(user?.id)))
        if (Array.isArray(d?.items) && d.items.length > 0) { setConfirmReplace('duplicate'); return }
      } catch { /* sin borrador */ }
    }
    const active = q.items.filter((it) => it.productActive)
    if (active.length === 0) { toast.error(t('Ningún producto de esta cotización sigue activo en el catálogo')); return }
    const items = active.map((it) => ({
      productId: it.productId, name: it.productName, sku: it.productSku, unit: it.unit,
      qty: Number(it.quantity),
      unitPrice: it.priceIsVariable ? Number(it.unitPrice) : (Number(it.currentSalePrice) || Number(it.unitPrice)),
    }))
    try {
      localStorage.setItem(quoteDraftKey(user?.id), JSON.stringify({
        items,
        customer: q.customerId ? { id: q.customerId, name: q.customerName, phone: q.customerPhone, email: q.customerEmail } : null,
        customerName: q.customerName ?? '', customerPhone: q.customerPhone ?? '', customerEmail: q.customerEmail ?? '',
        notes: q.notes ?? '', validityDays: q.validityDays ?? 7, duplicatedFrom: q.number, savedAt: Date.now(),
      }))
    } catch { toast.error(t('No se pudo preparar la copia (almacenamiento del navegador bloqueado)')); return }
    if (active.length < q.items.length) toast.warning(t('{n} producto(s) ya no están en el catálogo y no se copiaron', { n: q.items.length - active.length }))
    navigate('/cotizaciones')
  }

  // Arma el borrador de venta con TODAS las líneas y manda al POS. Si ya había
  // una venta a medias, se pregunta antes de pisarla.
  const sellAll = (force = false) => {
    if (!force) {
      try {
        const d = JSON.parse(localStorage.getItem(saleDraftKey(user?.id)))
        if (Array.isArray(d?.cart) && d.cart.length > 0) { setConfirmReplace('sell'); return }
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
                  {q.customerEmail && <span className="text-gray-500"> · {q.customerEmail}</span>}
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
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
                  <QuoteActions quote={printable()} primary={null} compact />
                </div>
                <div className="grid grid-cols-[auto_1fr_1fr] gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-end">
                  {confirmDelete ? (
                    <>
                      <span className="col-span-3 text-xs text-gray-500 sm:col-span-1">{t('¿Borrar esta cotización?')}</span>
                      <button onClick={remove} disabled={deleteQuote.isPending} className="rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50">{t('Sí, borrar')}</button>
                      <button onClick={() => setConfirmDelete(false)} className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50">{t('No')}</button>
                    </>
                  ) : (
                    <>
                      {canSell ? (
                        <button onClick={() => setConfirmDelete(true)} title={t('Borrar')}
                          className="flex items-center justify-center rounded-xl border border-gray-200 px-3 py-2.5 text-gray-400 hover:bg-red-50 hover:text-red-500"><Trash2 size={15} /></button>
                      ) : <span className="hidden sm:block" />}
                      {canSell && (
                        <button onClick={() => duplicate(false)}
                          className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                          <Copy size={15} /> {t('Duplicar')}
                        </button>
                      )}
                      {canSell && q.status !== 'CONVERTED' && (
                        <button onClick={() => navigate(`/cotizaciones/${q.id}/editar`)}
                          className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                          <PencilLine size={15} /> {t('Editar')}
                        </button>
                      )}
                      {canSell && q.status !== 'CONVERTED' && (
                        <button onClick={() => sellAll(false)}
                          className="col-span-3 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 sm:col-span-1 sm:py-2.5">
                          <ShoppingCart size={15} /> {t('Vender estos productos')}
                        </button>
                      )}
                    </>
                  )}
                </div>
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
                  <h3 className="text-base font-bold text-gray-900">{confirmReplace === 'duplicate' ? t('Ya tienes una cotización a medias') : t('Ya tienes una venta a medias')}</h3>
                  <p className="mt-1 text-sm text-gray-500">{confirmReplace === 'duplicate' ? t('Si sigues, esa cotización se reemplaza por la copia de esta.') : t('Si sigues, esa venta se reemplaza por los productos de esta cotización.')}</p>
                </div>
              </div>
              <div className="mt-5 flex flex-col gap-2">
                <button onClick={() => { const m = confirmReplace; setConfirmReplace(false); m === 'duplicate' ? duplicate(true) : sellAll(true) }} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">{confirmReplace === 'duplicate' ? t('Reemplazar y duplicar esta cotización') : t('Reemplazar y vender esta cotización')}</button>
                <button onClick={() => setConfirmReplace(false)} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">{t('Cancelar')}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
