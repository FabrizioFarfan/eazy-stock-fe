import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import EntityModal, { EntityField } from '../common/EntityModal'
import { useCreateParameter, useUpdateParameter } from '../../hooks/useParameters'
import { useAuth } from '../../context/AuthContext'
import { adminBizParam } from '../../utils/adminBiz'
import { getErrorMessage } from '../../utils/handleApiError'
import { PARAMETER_TYPES, TYPE_META, UNIT_PRESETS } from '../../utils/parameters'
import { useT } from '../../i18n'

/**
 * Crear / editar un parámetro (Frank, 4-nov-2026). Lo usan la página Catálogo › Parámetros y la ficha del
 * producto («Añadir parámetro › Nuevo…»: William pedía poder crearlos sin cerrar el producto). Va por portal al
 * body porque dentro del formulario del producto anidaría un <form> en otro.
 * `onCreated(parameter)` recibe el creado para que la ficha lo enseñe al momento.
 */
const inputCls =
  'rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 placeholder-gray-400 w-full bg-white'

export default function ParameterModal({ parameter, onClose, onCreated, initialName = '' }) {
  const t = useT()
  const { user } = useAuth()
  const isEdit = !!parameter
  const create = useCreateParameter()
  const update = useUpdateParameter()
  const mutation = isEdit ? update : create

  const [name, setName] = useState(parameter?.name ?? initialName)
  const [type, setType] = useState(parameter?.type ?? 'YES_NO')
  const [unit, setUnit] = useState(parameter?.unit ?? 'cm')
  const [options, setOptions] = useState(parameter?.options ?? [])
  const [pinned, setPinned] = useState(!!parameter?.pinned)
  const [optInput, setOptInput] = useState('')
  const [touched, setTouched] = useState(false)

  const addOption = () => {
    const v = optInput.trim()
    if (v && !options.some((o) => o.toLowerCase() === v.toLowerCase())) setOptions((prev) => [...prev, v])
    setOptInput('')
  }
  const removeOption = (o) => setOptions((prev) => prev.filter((x) => x !== o))

  const nameOk = name.trim().length >= 2
  const optionsOk = type !== 'OPTIONS' || options.length >= 2
  const ready = nameOk && optionsOk

  const onSubmit = async (e) => {
    e.preventDefault()
    setTouched(true)
    if (!ready) return
    const data = { name: name.trim(), type, unit: type === 'NUMBER' ? unit.trim() || null : null, options: type === 'OPTIONS' ? options : null, pinned }
    try {
      let saved
      if (isEdit) saved = await update.mutateAsync({ id: parameter.id, data, params: adminBizParam(user) })
      else saved = await create.mutateAsync({ ...data, ...adminBizParam(user) })
      toast.success(isEdit ? t('Parámetro guardado') : t('Parámetro creado'))
      if (!isEdit) onCreated?.(saved)
      onClose()
    } catch { /* el error se muestra abajo */ }
  }

  const meta = TYPE_META[type]
  const preview = type === 'YES_NO' ? `${t('Sí')} / ${t('No')}`
    : type === 'OPTIONS' ? (options.length ? options.join(' · ') : t('Añade las opciones'))
    : type === 'NUMBER' ? `${t('un número en')} ${unit || '…'}`
    : t('texto libre')

  return createPortal(
    <EntityModal onClose={onClose} onSubmit={onSubmit} isEdit={isEdit}
      title={isEdit ? t('Editar parámetro') : t('Nuevo parámetro')}
      subtitle={preview}
      avatar={(
        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-white/20 text-3xl ring-1 ring-white/30">
          {meta.emoji}
        </div>
      )}
      previewName={name} placeholderName={t('Nombre del parámetro')}
      submitting={mutation.isPending} submitLabel={isEdit ? t('Guardar cambios') : t('Crear parámetro')}
      error={mutation.isError ? getErrorMessage(mutation.error) : null}>

      <EntityField label={`${t('Nombre')} *`} hint={t('Como se verá en la ficha del producto y en el filtro.')} error={touched && !nameOk ? t('Mínimo 2 caracteres') : null}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('Ej. Artesanal, Color, Largo, Con borrador')}
          className={`${inputCls} py-3 text-base font-semibold`} autoFocus />
      </EntityField>

      <EntityField label={`${t('Qué tipo de dato es')} *`}>
        <div className="grid grid-cols-2 gap-2">
          {PARAMETER_TYPES.map((k) => {
            const m = TYPE_META[k]
            const on = type === k
            return (
              <button key={k} type="button" onClick={() => setType(k)} aria-pressed={on}
                className={`flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all ${
                  on ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600/20' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                <span className="text-xl leading-none">{m.emoji}</span>
                <span className="min-w-0">
                  <span className={`block text-sm font-bold ${on ? 'text-blue-800' : 'text-gray-900'}`}>{t(m.label)}</span>
                  <span className="block text-[11px] leading-snug text-gray-500">{t(m.hint)}</span>
                </span>
              </button>
            )
          })}
        </div>
        {isEdit && type !== parameter.type && (
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{t('Cambiar el tipo vuelve a leer lo que ya escribieron los productos con las reglas nuevas; lo que no encaje deja de filtrarse (el texto se conserva).')}</p>
        )}
      </EntityField>

      <label className={`flex cursor-pointer items-start gap-2.5 rounded-xl border px-3 py-2.5 text-sm ${pinned ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
        <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} className="mt-0.5 accent-blue-600" />
        <span>
          <span className="block font-semibold text-gray-900">{t('Fijado: sale siempre en la ficha del producto')}</span>
          <span className="block text-xs text-gray-500">{t('Sin fijar, solo aparece cuando el producto ya tiene valor o lo añades con «Añadir parámetro».')}</span>
        </span>
      </label>

      {type === 'NUMBER' && (
        <EntityField label={t('Medida')} hint={t('Se muestra al lado del número: 25 cm, 1.5 L, 2 kg.')}>
          <div className="flex flex-wrap items-center gap-1.5">
            {UNIT_PRESETS.map((u) => (
              <button key={u} type="button" onClick={() => setUnit(u)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors ${unit === u ? 'bg-blue-600 text-white' : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}>
                {u}
              </button>
            ))}
            <input value={unit} onChange={(e) => setUnit(e.target.value)} maxLength={16} placeholder={t('otra…')}
              className={`${inputCls} w-28 py-1.5 text-xs`} />
          </div>
        </EntityField>
      )}

      {type === 'OPTIONS' && (
        <EntityField label={`${t('Opciones')} *`} hint={t('Al menos dos. El producto elige una de la lista.')} error={touched && !optionsOk ? t('Pon al menos dos opciones') : null}>
          <div className="flex gap-2">
            <input value={optInput} onChange={(e) => setOptInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addOption() } }}
              placeholder={t('Ej. Rojo, Azul, Verde… (Enter para añadir)')} className={`${inputCls} flex-1`} />
            <button type="button" onClick={addOption} disabled={!optInput.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-40">
              <Plus size={15} />{t('Agregar')}
            </button>
          </div>
          {options.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {options.map((o) => (
                <span key={o} className="flex items-center gap-1 rounded-full bg-violet-50 py-1 pl-3 pr-1.5 text-sm font-semibold text-violet-700 ring-1 ring-violet-100">
                  {o}
                  <button type="button" onClick={() => removeOption(o)} aria-label={t('Quitar')} className="flex items-center justify-center rounded-full p-0.5 hover:bg-violet-200"><X size={12} /></button>
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-3 rounded-xl border-2 border-dashed border-gray-100 px-3 py-3 text-center text-xs text-gray-400">{t('Aún sin opciones: escribe una y toca Agregar')}</p>
          )}
        </EntityField>
      )}
    </EntityModal>,
    document.body,
  )
}

