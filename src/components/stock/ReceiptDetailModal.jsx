import { useState } from 'react'
import { X, Truck, Loader2, FileText, Pencil, Trash2, AlertTriangle, ArrowRight, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../../context/AuthContext'
import {
  useReceiptDetail, useReferenceCheck, useUpdateReceiptReference,
  useAnnulReceiptPreview, useAnnulReceipt,
} from '../../hooks/useReceipts'
import ReferenceCheckHint from './ReferenceCheckHint'
import { formatPrice } from '../../utils/formatMoney'
import { formatQty } from '../../utils/quantity'
import { getErrorMessage } from '../../utils/handleApiError'
import { useT, dateLocale } from '../../i18n'

function formatDate(str) {
  if (!str) return '—'
  return new Intl.DateTimeFormat(dateLocale(), {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(str))
}

/**
 * Detalle de una recepción. Desde acá se corrige lo que William pidió cuando
 * cargó una factura dos veces:
 *  - «Cambiar número»: corrige la factura / guía (con el mismo chequeo en vivo
 *    de repetidas que el modal de nueva recepción).
 *  - «Anular recepción» (solo OWNER): borra la recepción, descuenta del stock
 *    lo que había sumado y baja la deuda con el proveedor si fue a crédito.
 *    Antes muestra el impacto producto por producto y bloquea si algún stock
 *    quedaría negativo.
 */
export default function ReceiptDetailModal({ receiptId, onClose }) {
  const t = useT()
  const { user } = useAuth()
  const isOwner = user?.role === 'OWNER'
  const { data: receipt, isLoading, isError } = useReceiptDetail(receiptId)

  // ── Cambiar número ──
  const [editingRef, setEditingRef] = useState(false)
  const [refDraft, setRefDraft]     = useState('')
  const [refError, setRefError]     = useState(null)
  const refCheck = useReferenceCheck(editingRef ? receipt?.supplierId : null, refDraft, receiptId)
  const refDuplicated = !!(refCheck.result?.exists && refCheck.result?.sameSupplier)
  const updateRef = useUpdateReceiptReference()

  const startEditRef = () => { setRefDraft(receipt?.referenceDocument ?? ''); setRefError(null); setEditingRef(true) }
  const saveRef = async () => {
    setRefError(null)
    if (refDuplicated) {
      setRefError(t('La factura «{ref}» ya está registrada para {supplier}. Corregí el número o anulá la recepción anterior.', { ref: refCheck.result.referenceDocument, supplier: receipt.supplierName }))
      return
    }
    try {
      await updateRef.mutateAsync({ id: receiptId, supplierId: receipt.supplierId, referenceDocument: refDraft.trim() || null })
      toast.success(t('Número de factura actualizado'))
      setEditingRef(false)
    } catch (err) {
      setRefError(getErrorMessage(err))
    }
  }

  // ── Anular ──
  const [annulling, setAnnulling] = useState(false)
  const [annulError, setAnnulError] = useState(null)
  const { data: preview, isLoading: loadingPreview } = useAnnulReceiptPreview(annulling ? receiptId : null)
  const annul = useAnnulReceipt()
  const confirmAnnul = async () => {
    setAnnulError(null)
    try {
      await annul.mutateAsync({ id: receiptId, supplierId: receipt.supplierId })
      toast.success(
        preview?.hadDebt
          ? t('Recepción anulada — stock revertido y {amount} descontados de la deuda con {supplier}', { amount: formatPrice(receipt.transaction?.amount ?? 0), supplier: receipt.supplierName })
          : t('Recepción anulada — stock revertido'),
      )
      onClose()
    } catch (err) {
      setAnnulError(getErrorMessage(err))
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">

        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h3 className="font-semibold text-gray-900">
              {annulling ? t('Anular recepción') : t('Detalle de recepción')}
            </h3>
            {receipt && (
              <p className="mt-0.5 text-xs text-gray-400">{formatDate(receipt.createdAt)}</p>
            )}
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-gray-400" /></div>
          ) : isError || !receipt ? (
            <p className="py-6 text-center text-sm text-red-500">{t('No pudimos cargar la recepción.')}</p>
          ) : annulling ? (
            /* ── Confirmación de anulación con impacto ── */
            <div className="space-y-4">
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-100">
                <p className="flex items-center gap-2 font-semibold"><AlertTriangle size={15} /> {t('Esto no se puede deshacer')}</p>
                <p className="mt-1 text-xs text-red-700">
                  {t('Se borra la recepción de {supplier}{ref} y se descuenta del stock lo que había sumado cada producto.', {
                    supplier: receipt.supplierName,
                    ref: receipt.referenceDocument ? ` (${receipt.referenceDocument})` : '',
                  })}
                  {receipt.transaction && ' ' + t('La deuda con el proveedor baja {amount}.', { amount: formatPrice(receipt.transaction.amount) })}
                </p>
              </div>

              {loadingPreview || !preview ? (
                <div className="flex justify-center py-6"><Loader2 size={22} className="animate-spin text-gray-400" /></div>
              ) : (
                <>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                        <th className="pb-2">{t('Producto')}</th>
                        <th className="pb-2 text-center">{t('Descuenta')}</th>
                        <th className="pb-2 text-right">{t('Stock')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {preview.lines.map((l) => {
                        const bad = Number(l.stockAfter) < 0
                        return (
                          <tr key={l.productId} className={bad ? 'bg-red-50/60' : ''}>
                            <td className="py-2">
                              <p className="font-medium text-gray-900">{l.productName}</p>
                              <p className="font-mono text-xs text-gray-400">{l.productSku}</p>
                            </td>
                            <td className="py-2 text-center font-mono text-red-600">−{formatQty(l.quantity)}</td>
                            <td className="py-2 text-right font-mono">
                              <span className="text-gray-500">{formatQty(l.stockNow)}</span>
                              <ArrowRight size={12} className="mx-1 inline text-gray-300" />
                              <span className={bad ? 'font-bold text-red-600' : 'font-semibold text-gray-900'}>{formatQty(l.stockAfter)}</span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>

                  {preview.hadDebt && (
                    <div className="flex items-center justify-between rounded-xl bg-amber-50 px-4 py-3 text-sm ring-1 ring-amber-100">
                      <span className="font-medium text-amber-900">{t('Deuda con {supplier}', { supplier: preview.supplierName })}</span>
                      <span className="font-mono">
                        <span className="text-amber-700">{formatPrice(preview.debtNow)}</span>
                        <ArrowRight size={12} className="mx-1 inline text-amber-300" />
                        <span className="font-bold text-amber-900">{formatPrice(preview.debtAfter)}</span>
                      </span>
                    </div>
                  )}
                  {preview.debtWouldGoNegative && (
                    <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                      {t('Ya pagaste esta entrega: el pago queda registrado como ajuste para que la deuda no quede negativa.')}
                    </p>
                  )}
                  {!preview.canAnnul && (
                    <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
                      <p className="font-semibold">{t('No se puede anular todavía')}</p>
                      <p className="mt-0.5 text-xs">
                        {t('Ya se vendió más de lo que quedaría en stock de: {names}. Ajustá el stock de esos productos en Movimientos y volvé a intentar.', { names: preview.blocked.join(', ') })}
                      </p>
                    </div>
                  )}
                </>
              )}
              {annulError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{annulError}</p>}
            </div>
          ) : (
            /* ── Detalle normal ── */
            <>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Truck size={16} className="text-blue-600" />
                  <span className="text-base font-semibold text-gray-900">{receipt.supplierName}</span>
                </div>
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  receipt.paymentMode === 'CREDIT'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {receipt.paymentMode === 'CREDIT' ? t('A crédito') : t('Al contado')}
                </span>
              </div>

              <div className="mb-4 space-y-1 rounded-xl bg-gray-50 px-4 py-3 text-sm">
                {editingRef ? (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">{t('Referencia (factura / guía)')}</label>
                    <div className="flex gap-2">
                      <input
                        autoFocus
                        value={refDraft}
                        onChange={(e) => setRefDraft(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveRef() } if (e.key === 'Escape') setEditingRef(false) }}
                        maxLength={100}
                        placeholder={t('Factura 0023-001234')}
                        className={`w-full rounded-lg border bg-white px-3 py-1.5 text-sm outline-none focus:ring-2 ${refDuplicated ? 'border-red-400 focus:ring-red-500/20' : 'border-gray-200 focus:border-blue-600 focus:ring-blue-600/20'}`}
                      />
                      <button type="button" onClick={saveRef} disabled={updateRef.isPending || refDuplicated}
                        className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                        {updateRef.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} {t('Guardar')}
                      </button>
                      <button type="button" onClick={() => setEditingRef(false)}
                        className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-200">
                        {t('Cancelar')}
                      </button>
                    </div>
                    <ReferenceCheckHint result={refCheck.result} checking={refCheck.checking} supplierName={receipt.supplierName} />
                    {refError && <p className="mt-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs text-red-600">{refError}</p>}
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <p className="flex items-center gap-1.5 text-gray-600">
                      <FileText size={13} className="text-gray-400" />
                      {receipt.referenceDocument ?? <span className="text-gray-400">{t('Sin factura / guía')}</span>}
                    </p>
                    <button type="button" onClick={startEditRef}
                      className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50">
                      <Pencil size={12} /> {t('Cambiar número')}
                    </button>
                  </div>
                )}
                {receipt.notes && <p className="text-xs text-gray-500">{receipt.notes}</p>}
              </div>

              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                    <th className="pb-2">{t('Producto')}</th>
                    <th className="pb-2 text-center">{t('Cant.')}</th>
                    <th className="pb-2 text-right">{t('P. unit.')}</th>
                    <th className="pb-2 text-right">{t('Subtotal')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(receipt.movements ?? []).map((m) => (
                    <tr key={m.id}>
                      <td className="py-2.5">
                        <p className="font-medium text-gray-900">{m.productName}</p>
                        <p className="font-mono text-xs text-gray-400">{m.productSku}</p>
                      </td>
                      <td className="py-2.5 text-center font-mono text-gray-700">{m.quantity}</td>
                      <td className="py-2.5 text-right text-gray-600">{formatPrice(m.unitCost)}</td>
                      <td className="py-2.5 text-right font-semibold text-gray-900">{formatPrice(m.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {receipt.transaction && (
                <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm ring-1 ring-amber-100">
                  <p className="font-semibold text-amber-900">{t('Generó cuenta por pagar')}</p>
                  <p className="mt-0.5 text-xs text-amber-700">
                    {t('Esta recepción sumó')} <span className="font-mono font-semibold">{formatPrice(receipt.transaction.amount)}</span>{' '}
                    {t('a la deuda con el proveedor. Saldo después: {balance}.', { balance: formatPrice(receipt.transaction.balanceAfter) })}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {receipt && (
          <div className="flex items-center justify-between gap-3 rounded-b-2xl border-t border-gray-200 bg-gray-50 px-6 py-4">
            {annulling ? (
              <>
                <button type="button" onClick={() => { setAnnulling(false); setAnnulError(null) }}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200">
                  {t('Volver')}
                </button>
                <button type="button" onClick={confirmAnnul}
                  disabled={annul.isPending || !preview || !preview.canAnnul}
                  className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                  {annul.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  {annul.isPending ? t('Anulando...') : t('Sí, anular la recepción')}
                </button>
              </>
            ) : (
              <>
                {isOwner ? (
                  <button type="button" onClick={() => setAnnulling(true)}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                    title={t('Borra la recepción y revierte el stock y la deuda (para una factura cargada dos veces)')}>
                    <Trash2 size={14} /> {t('Anular recepción')}
                  </button>
                ) : <span />}
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-gray-500">{t('Total recepción')}</span>
                  <span className="text-lg font-bold text-gray-900">{formatPrice(receipt.totalAmount)}</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
