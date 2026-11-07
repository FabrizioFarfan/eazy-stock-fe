import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { ParameterValueInput } from '../products/ParameterFields'
import { useParameters } from '../../hooks/useParameters'
import { useAuth } from '../../context/AuthContext'
import { useT } from '../../i18n'

/**
 * Los parámetros de un lote: `value` = { nombre: valor }, `onChange(mapa)`. `lots` = los lotes que el producto ya tiene,
 * para reutilizarlos de un toque (la misma combinación suma al mismo lote).
 */
export default function LotFields({ value = {}, onChange, lots = [] }) {
  const t = useT()
  const { user } = useAuth()
  const { data: parameters = [] } = useParameters(user?.role === 'SUPER_ADMIN' && user?.businessId ? { businessId: user.businessId } : {})
  const [paramId, setParamId] = useState('')
  const [draft, setDraft] = useState('')
  const parameter = parameters.find((p) => p.id === paramId) ?? null

  const add = (v) => {
    const text = String(v ?? '').trim()
    if (!parameter || text === '') return
    onChange({ ...value, [parameter.name]: text })
    setParamId('')
    setDraft('')
  }
  const remove = (name) => {
    const next = { ...value }
    delete next[name]
    onChange(next)
  }
  // Sí/No y opciones se entienden al elegir: no hace falta otro toque en «Añadir».
  const pick = (v) => {
    if (parameter?.type === 'YES_NO' || parameter?.type === 'OPTIONS') { if (String(v).trim() !== '') add(v); else setDraft('') }
    else setDraft(v)
  }
  const entries = Object.entries(value)
  return (
    <div className="flex flex-col gap-2" data-testid="lot-fields">
      {lots.length > 0 && entries.length === 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-gray-500">{t('Igual que:')}</span>
          {lots.map((l) => (
            <button key={l.id} type="button" onClick={() => onChange(l.parameters)} data-testid="lot-reuse"
              className="rounded-full border border-blue-200 bg-white px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50">
              {l.label}
            </button>
          ))}
        </div>
      )}
      {entries.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {entries.map(([name, v]) => (
            <span key={name} className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-800">
              {name}: {v}
              <button type="button" onClick={() => remove(name)} aria-label={t('Quitar {name}', { name })} className="text-violet-400 hover:text-red-500"><X size={12} /></button>
            </span>
          ))}
        </div>
      )}
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
        <select value={paramId} onChange={(e) => { setParamId(e.target.value); setDraft('') }} aria-label={t('Parámetro')} data-testid="lot-param-pick"
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-600">
          <option value="">{entries.length > 0 ? t('Añadir otro parámetro…') : t('¿Qué tiene de distinto?')}</option>
          {parameters.filter((p) => !(p.name in value)).map((p) => <option key={p.id} value={p.id}>{p.name}{p.unit ? ` (${p.unit})` : ''}</option>)}
        </select>
        <div className="min-w-0" data-testid="lot-param-value">
          {parameter
            ? <ParameterValueInput key={parameter.id} parameter={parameter} value={draft} onChange={pick} />
            : <div className="rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-400">—</div>}
        </div>
        {parameter && (parameter.type === 'NUMBER' || parameter.type === 'TEXT') && (
          <button type="button" onClick={() => add(draft)} disabled={String(draft).trim() === ''} data-testid="lot-param-add"
            className="inline-flex items-center justify-center gap-1 rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40">
            <Plus size={14} /> {t('Añadir')}
          </button>
        )}
      </div>
      {parameters.length === 0 && <p className="text-xs text-gray-500">{t('Crea primero el parámetro en Catálogo › Parámetros.')}</p>}
    </div>
  )
}
