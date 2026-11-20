import { Truck, TrendingDown } from 'lucide-react'
import { useSupplierPrices } from '../../hooks/useSupplierPrices'
import { formatPrice } from '../../utils/formatMoney'
import { formatNumericDate } from '../../utils/formatDate'
import { useT } from '../../i18n'

/**
 * «Quién me lo trae y a cuánto» en la ficha del producto (William, 20-nov-2026): la última compra a cada proveedor
 * que lo trajo alguna vez, del más barato al más caro. Sale sola de las compras registradas. Con un solo proveedor
 * no hay nada que comparar y no se pinta.
 */
export default function SupplierOffers({ product, businessId }) {
  const t = useT()
  const { byProduct } = useSupplierPrices([product.id], businessId)
  const offers = byProduct[product.id] ?? []
  if (offers.length < 2) return null
  const cheapest = Number(offers[0].unitCost)
  return (
    <div data-testid="supplier-offers">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">{t('Quién te lo trae y a cuánto')}</p>
      <div className="overflow-hidden rounded-xl border border-gray-100">
        {offers.map((o, i) => {
          const best = i === 0
          const more = Number(o.unitCost) - cheapest
          return (
            <div key={o.supplierId} data-testid="supplier-offer"
              className={`flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-3 py-2.5 ${i > 0 ? 'border-t border-gray-100' : ''} ${best ? 'bg-emerald-50/60' : 'bg-white'}`}>
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-gray-900">
                  <Truck size={13} className="flex-shrink-0 text-gray-400" />
                  <span className="truncate">{o.supplierName}</span>
                  {o.supplierId === product.supplierId && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">{t('el de siempre')}</span>
                  )}
                  {best && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                      <TrendingDown size={10} /> {t('el más barato')}
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-500">
                  {t('Última compra')}: {formatNumericDate(o.date)}
                  {o.referenceDocument ? ` · ${o.referenceDocument}` : ''}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold ${best ? 'text-emerald-700' : 'text-gray-900'}`}>{formatPrice(o.unitCost)}</p>
                {!best && more > 0 && <p className="text-[11px] text-red-500">+{formatPrice(more)}</p>}
              </div>
            </div>
          )
        })}
      </div>
      <p className="mt-1.5 text-[11px] text-gray-400">{t('Es el precio de la última compra a cada uno. Se actualiza solo con cada compra que registras.')}</p>
    </div>
  )
}
