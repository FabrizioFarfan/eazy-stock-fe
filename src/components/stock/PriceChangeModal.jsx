import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Check, Pencil } from 'lucide-react'
import PriceInput from '../inputs/PriceInput'
import { formatPrice } from '../../utils/formatMoney'
import { totalExtra } from '../../utils/purchasePriceChanges'
import { BIG_CHANGE } from '../../utils/priceSanity'
import { useT } from '../../i18n'

/**
 * Al guardar una compra, si algún producto cambió de precio (Frank, 7-nov-2026): antes lo pagabas X, ahora Y, cuánto
 * ganas ahora, y si desde ahora cuesta siempre así o solo en esta compra. Va por portal porque se abre desde otro modal.
 * `changes` sale de purchasePriceChanges; `onConfirm({ [id]: { keep, salePrice } })`.
 */
export default function PriceChangeModal({ changes, onConfirm, onCancel }) {
  const t = useT()
  const [keep, setKeep] = useState({})
  const [sale, setSale] = useState({})

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel])

  const extra = totalExtra(changes)
  const confirm = () => onConfirm(Object.fromEntries(changes.map((c) => [c.id, {
    keep: !!keep[c.id],
    salePrice: sale[c.id]?.value ?? null,
  }])))

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-3 sm:p-6" data-testid="price-change-modal"
      role="dialog" aria-modal="true" aria-labelledby="price-change-title">
      <div className="flex max-h-[92dvh] w-full max-w-5xl flex-col rounded-2xl bg-white shadow-2xl">
        <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
          <h2 id="price-change-title" className="text-lg font-bold text-gray-900">
            {changes.length === 1 ? t('Este producto cambió de precio') : t('{n} productos cambiaron de precio', { n: changes.length })}
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">{t('Míralo antes de guardar la compra.')}</p>
        </div>

        <div className="min-h-0 flex-1 divide-y divide-gray-100 overflow-y-auto px-5 sm:px-6">
          {changes.map((c) => {
            const up = c.diff > 0
            const Arrow = up ? ArrowUpRight : ArrowDownRight
            const saleOpen = !!sale[c.id]
            const saleNow = sale[c.id]?.value != null ? Number(sale[c.id].value) : c.salePrice
            const marginNow = saleNow != null ? saleNow - c.newCost : null
            return (
              <div key={c.id} className="grid gap-4 py-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]" data-testid="price-change-row">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-gray-900">{c.name}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-gray-600">
                    <span>{t('Antes lo pagabas {price}', { price: formatPrice(c.oldCost) })}</span>
                    <span aria-hidden="true">→</span>
                    <span className="font-semibold text-gray-900">{t('ahora {price}', { price: formatPrice(c.newCost) })}</span>
                    <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-bold ${up ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                      <Arrow size={12} /> {up ? '+' : '−'}{formatPrice(Math.abs(c.diff))} · {c.pct} %
                    </span>
                  </p>
                  {c.pct / 100 > BIG_CHANGE && (
                    <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-amber-600">
                      <AlertTriangle size={12} className="flex-shrink-0" /> {t('Es un cambio muy grande: revisa que no sea un error al escribirlo.')}
                    </p>
                  )}
                  {c.salePrice != null && (
                    <div className="mt-2 text-sm text-gray-600">
                      <p>
                        {t('Lo vendes a {price}.', { price: formatPrice(saleNow) })}{' '}
                        {t('Ganabas {before} por unidad; ahora {after}.', { before: formatPrice(c.oldMargin), after: formatPrice(marginNow) })}
                      </p>
                      {saleOpen ? (
                        <div className="mt-1.5 max-w-[14rem]">
                          <PriceInput value={sale[c.id].value} onChange={(v) => setSale((s) => ({ ...s, [c.id]: { value: v } }))} maxDecimals={6} />
                        </div>
                      ) : (
                        <button type="button" onClick={() => setSale((s) => ({ ...s, [c.id]: { value: c.salePrice } }))}
                          className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline">
                          <Pencil size={11} /> {t('Cambiar el precio de venta')}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <fieldset className="min-w-0">
                  <legend className="mb-1.5 text-xs font-semibold text-gray-700">{t('¿Desde ahora cuesta siempre así?')}</legend>
                  <div className="grid gap-1.5">
                    {[[false, t('Sí, es el nuevo precio de compra')], [true, t('No, solo en esta compra')]].map(([value, label]) => (
                      <label key={String(value)} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors ${
                        !!keep[c.id] === value ? 'border-blue-600 bg-blue-50 font-semibold text-blue-700' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                        <input type="radio" name={`price-${c.id}`} checked={!!keep[c.id] === value}
                          onChange={() => setKeep((k) => ({ ...k, [c.id]: value }))} className="h-4 w-4 flex-shrink-0 text-blue-600" />
                        {label}
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>
            )
          })}
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-sm text-gray-600" data-testid="price-change-total">
            {extra > 0 && t('En esta compra pagas {amount} más que antes.', { amount: formatPrice(extra) })}
            {extra < 0 && t('En esta compra pagas {amount} menos que antes.', { amount: formatPrice(-extra) })}
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={onCancel}
              className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 sm:flex-none">
              {t('Volver a la compra')}
            </button>
            <button type="button" onClick={confirm} data-testid="price-change-confirm"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 sm:flex-none">
              <Check size={15} /> {t('Guardar la compra')}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
