import { useState } from 'react'
import { Plus, Sparkles, X } from 'lucide-react'
import ParameterModal from '../products/ParameterModal'
import { ParameterValueInput } from '../products/ParameterFields'
import { useParameters } from '../../hooks/useParameters'
import { useAuth } from '../../context/AuthContext'
import { attrValueFor, withParamValue } from '../../utils/parameters'
import { useT } from '../../i18n'

/**
 * Poner parámetros a los productos de una factura de una vez (William, 7-nov-2026: «si no, tiene que hacerlo producto
 * por producto»). Eliges parámetro y valor, marcas a qué productos y listo; cada fila enseña lo que ya tiene.
 * Controlado: `lines` = [{ id, name, sku, attributes }], `onChange(id, attributes)`. Quien lo usa decide cuándo guardar.
 */
export default function ReceiptParameters({ lines, onChange }) {
  const t = useT()
  const { user } = useAuth()
  const { data: parameters = [] } = useParameters(user?.role === 'SUPER_ADMIN' && user?.businessId ? { businessId: user.businessId } : {})
  const [paramId, setParamId] = useState('')
  const [value, setValue] = useState('')
  const [skipped, setSkipped] = useState(() => new Set())   // desmarcados: los productos nuevos entran marcados
  const [creating, setCreating] = useState(false)

  const parameter = parameters.find((p) => p.id === paramId) ?? null
  const marked = lines.filter((l) => !skipped.has(l.id))
  const toggle = (id) => setSkipped((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })
  const apply = () => {
    if (!parameter || String(value).trim() === '') return
    marked.forEach((l) => onChange(l.id, withParamValue(l.attributes, parameter.name, value)))
    setValue('')
  }
  const onPick = (e) => {
    if (e.target.value === '__new__') { setCreating(true); return }
    setParamId(e.target.value)
    setValue('')
  }

  return (
    <div className="flex flex-col gap-3" data-testid="receipt-parameters">
      <div className="grid gap-2 rounded-xl bg-gray-50 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
        <div className="min-w-0">
          <label htmlFor="receipt-param" className="mb-1 block text-xs font-semibold text-gray-600">{t('Parámetro')}</label>
          <select id="receipt-param" value={paramId} onChange={onPick} data-testid="receipt-param-pick"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-600">
            <option value="">{t('Elige uno…')}</option>
            {parameters.map((p) => <option key={p.id} value={p.id}>{p.name}{p.unit ? ` (${p.unit})` : ''}</option>)}
            <option value="__new__">{t('Nuevo parámetro…')}</option>
          </select>
        </div>
        <div className="min-w-0" data-testid="receipt-param-value">
          <p className="mb-1 text-xs font-semibold text-gray-600">{t('Valor')}</p>
          {parameter
            ? <ParameterValueInput key={parameter.id} parameter={parameter} value={value} onChange={setValue} />
            : <div className="rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-400">—</div>}
        </div>
        <button type="button" onClick={apply} disabled={!parameter || String(value).trim() === '' || marked.length === 0} data-testid="receipt-param-apply"
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-40">
          <Plus size={14} /> {t('Poner a {n}', { n: marked.length })}
        </button>
      </div>

      <ul className="divide-y divide-gray-100 rounded-xl border border-gray-100">
        {lines.map((l) => {
          const set = parameters.filter((p) => attrValueFor(l.attributes, p.name) !== '')
          return (
            <li key={l.id} className="flex items-start gap-2.5 px-3 py-2" data-testid="receipt-param-line">
              <input type="checkbox" checked={!skipped.has(l.id)} onChange={() => toggle(l.id)} aria-label={t('Incluir {name}', { name: l.name })}
                className="mt-1 h-4 w-4 flex-shrink-0 rounded border-gray-300 text-blue-600" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">{l.name}</p>
                {set.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {set.map((p) => (
                      <span key={p.id} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                        {p.name}: {attrValueFor(l.attributes, p.name)}{p.unit ? ` ${p.unit}` : ''}
                        <button type="button" onClick={() => onChange(l.id, withParamValue(l.attributes, p.name, ''))} aria-label={t('Quitar {name}', { name: p.name })}
                          className="rounded-full text-blue-400 hover:text-red-500"><X size={11} /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ul>
      <p className="flex items-start gap-1.5 text-[11px] text-gray-400">
        <Sparkles size={12} className="mt-px flex-shrink-0" /> {t('Vale para todo el producto, también lo que ya tenías. Si solo esta compra viene distinta, usa «Esta compra viene distinta».')}
      </p>
      {creating && <ParameterModal parameter={null} onClose={() => setCreating(false)} onCreated={(p) => { if (p?.id) { setParamId(p.id); setValue('') } }} />}
    </div>
  )
}
