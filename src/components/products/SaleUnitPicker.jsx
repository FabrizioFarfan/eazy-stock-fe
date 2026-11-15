import { useT } from '../../i18n'
import { formatPrice } from '../../utils/formatMoney'
import { formatQty } from '../../utils/quantity'
import { saleUnitsOf } from '../../utils/saleUnits'

/**
 * ¿Cómo lo lleva? Botones para vender un producto por su unidad o por una de sus formas de venta (ciento, caja…),
 * cada una con su precio (William, 11-nov-2026). `value` null = la unidad del producto.
 */
export default function SaleUnitPicker({ product, value, onChange, className = '' }) {
  const t = useT()
  const forms = saleUnitsOf(product)
  if (forms.length === 0) return null
  const baseUnit = product.unit || t('unidad')
  const options = [
    { id: null, name: baseUnit, detail: null, price: product.priceIsVariable ? null : product.salePrice },
    ...forms.map((u) => ({ id: u.id, name: u.name, detail: `${formatQty(u.units)} ${baseUnit}`, price: u.salePrice })),
  ]
  return (
    <div className={className} data-testid="sale-form-picker">
      <p className="mb-1 text-xs font-semibold text-gray-500">{t('¿Cómo lo lleva?')}</p>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={t('¿Cómo lo lleva?')}>
        {options.map((o) => {
          const on = (value ?? null) === o.id
          return (
            <button key={o.id ?? 'base'} type="button" role="radio" aria-checked={on} onClick={() => onChange(o.id)} data-testid="sale-form-option"
              title={o.detail ? t('1 {name} = {detail}', { name: o.name, detail: o.detail }) : undefined}
              className={`rounded-lg border px-2.5 py-1.5 text-left text-xs font-semibold transition-colors ${on ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}>
              {o.name}
              {o.detail && <span className={on ? 'text-blue-100' : 'text-gray-400'}> · {o.detail}</span>}
              {o.price != null && <span className={on ? 'text-blue-100' : 'text-gray-400'}> · {formatPrice(o.price)}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
