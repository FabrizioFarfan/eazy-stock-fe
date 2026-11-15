import { Plus, Trash2 } from 'lucide-react'
import { useT } from '../../i18n'
import { formatPrice, currencySymbol } from '../../utils/formatMoney'
import { emptySaleUnitRow, pricePerBaseUnit, rowIsEmpty } from '../../utils/saleUnits'

export const MAX_SALE_UNITS = 8

const inputCls = 'w-full min-w-0 rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'

/**
 * Formas de venta del producto (William, 11-nov-2026): además de por su unidad, se vende por ciento, caja, docena…
 * cada una con cuántas unidades trae y su precio. `rows` = [{ id, name, units, salePrice }]; `errors` es la lista
 * paralela de saleUnitRowErrors (solo se pinta cuando `showErrors`).
 */
export default function SaleUnitsEditor({ rows, onChange, unit, errors = [], showErrors = false }) {
  const t = useT()
  const baseUnit = unit || t('unidad')
  const setRow = (index, patch) => onChange(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  const removeRow = (index) => onChange(rows.filter((_, i) => i !== index))
  const message = (code) => ({
    NAME: t('Ponle un nombre: ciento, caja, docena…'),
    UNITS: t('Di cuántas trae (más de 0).'),
    PRICE: t('Ponle su precio.'),
    DUPLICATE: t('Ese nombre ya está en otra forma.'),
    SAME_AS_UNIT: t('Ese ya es el nombre de la unidad del producto: ponle otro.'),
  }[code])

  return (
    <div data-tutorial-target="sale-forms" data-testid="sale-units-editor" className="mt-3 rounded-xl border border-gray-200 bg-gray-50/60 p-3">
      <p className="text-sm font-bold text-gray-900">{t('Formas de venta')} <span className="text-xs font-normal text-gray-400">{t('(opcional)')}</span></p>
      <p className="mt-0.5 text-xs leading-snug text-gray-500">
        {t('¿También lo vendes por ciento, por caja o por docena? Pon cada forma con cuántas trae y su precio. Al vender eliges cuál y el precio sale solo; el stock se sigue contando en {unit}.', { unit: baseUnit })}
      </p>

      {rows.length > 0 && (
        <ul className="mt-2.5 space-y-2">
          {rows.map((row, i) => {
            const error = showErrors ? errors[i] : null
            const each = pricePerBaseUnit(row)
            return (
              <li key={row.id ?? `new-${i}`} data-testid="sale-unit-row" className={`rounded-lg border bg-white p-2 ${error ? 'border-red-300' : 'border-gray-200'}`}>
                <div className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-1.5">
                  <label className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate text-[11px] font-medium text-gray-500">{t('Se llama')}</span>
                    <input value={row.name} onChange={(e) => setRow(i, { name: e.target.value })} maxLength={40} placeholder={t('ciento')}
                      data-testid="sale-unit-name" className={inputCls} />
                  </label>
                  <label className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate text-[11px] font-medium text-gray-500" title={t('Cuántas {unit} trae', { unit: baseUnit })}>{t('Trae')}</span>
                    <input value={row.units} onChange={(e) => setRow(i, { units: e.target.value })} type="number" inputMode="decimal" min="0" step="any" placeholder="100"
                      data-testid="sale-unit-units" className={inputCls} />
                  </label>
                  <label className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate text-[11px] font-medium text-gray-500">{t('Precio')} ({currencySymbol()})</span>
                    <input value={row.salePrice} onChange={(e) => setRow(i, { salePrice: e.target.value })} type="number" inputMode="decimal" min="0" step="any" placeholder="0.00"
                      data-testid="sale-unit-price" className={inputCls} />
                  </label>
                  <button type="button" onClick={() => removeRow(i)} title={t('Quitar')} aria-label={t('Quitar')} data-testid="sale-unit-remove"
                    className="mb-0.5 rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500">
                    <Trash2 size={15} />
                  </button>
                </div>
                {error ? (
                  <p className="mt-1 text-[11px] font-semibold text-red-600" data-testid="sale-unit-error">{message(error)}</p>
                ) : !rowIsEmpty(row) && each != null ? (
                  <p className="mt-1 text-[11px] text-gray-500">
                    {t('1 {name} = {units} {unit} · cada {unit} sale a {each}', { name: String(row.name).trim() || '…', units: row.units, unit: baseUnit, each: formatPrice(each) })}
                  </p>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}

      {rows.length < MAX_SALE_UNITS && (
        <button type="button" onClick={() => onChange([...rows, emptySaleUnitRow()])} data-testid="sale-unit-add"
          className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100">
          <Plus size={13} /> {t('Agregar forma de venta')}
        </button>
      )}
    </div>
  )
}
