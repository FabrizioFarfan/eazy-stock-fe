import { useState } from 'react'
import { Plus, X, Search, Loader2, AlertTriangle, CheckCircle2, Circle } from 'lucide-react'
import { getErrorMessage } from '../../utils/handleApiError'
import { useT } from '../../i18n'

/**
 * Chip picker (los chips envuelven en filas, con scroll vertical) + quick-add inline.
 * Parent handles the actual mutation; este componente solo muestra el resultado.
 *
 * Errores de la mutación inline: si onCreate rechaza, mostramos el mensaje
 * dentro del propio sub-form para que el usuario tenga feedback sin que
 * el modal padre se quede en estado roto.
 */
export default function EntityPicker({
  label,
  helperText,
  items = [],
  value,
  onChange,
  onCreate,
  extraFields = [],
  placeholder,
  createLabel,
  createButtonLabel,
  newNamePlaceholder,
  warnIfLikely,
  isCreating = false,
}) {
  const t = useT()
  const searchPlaceholder = placeholder        ?? t('Buscar...')
  const createText        = createLabel        ?? t('Nuevo')
  const createButtonText  = createButtonLabel  ?? t('Crear')
  const namePlaceholder   = newNamePlaceholder ?? t('Nombre *')
  const [search, setSearch]     = useState('')
  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName]   = useState('')
  const [extra, setExtra]       = useState({})
  const [createError, setCreateError] = useState(null)

  const filtered = items.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase()),
  )

  const selectedItem = items.find((i) => i.id === value)

  // Warning UX opcional: si la palabra que el usuario escribió huele a un tipo
  // distinto (ej. nombre de un proveedor cuando estamos creando categoría).
  const warning = warnIfLikely ? warnIfLikely(newName) : null

  const handleCreate = async () => {
    if (!newName.trim()) return
    setCreateError(null)
    try {
      await onCreate(newName.trim(), extra)
      setNewName('')
      setExtra({})
      setShowForm(false)
      setSearch('')
    } catch (err) {
      setCreateError(getErrorMessage(err))
    }
  }

  const cancelForm = () => {
    setShowForm(false)
    setNewName('')
    setExtra({})
    setCreateError(null)
  }

  // Con pocas opciones el buscador es ruido (y confundía: parecía que había
  // que ESCRIBIR la marca en vez de tocar una). Solo aparece con muchas.
  const showSearch = items.length > 6
  const optionCount = items.length

  return (
    <div className="flex flex-col gap-1.5">
      {/* Label + contador / quitar */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        {selectedItem ? (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="flex items-center gap-0.5 text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            <X size={11} />
            {t('Quitar')}
          </button>
        ) : optionCount > 0 ? (
          <span className="text-[11px] text-gray-400">
            {optionCount === 1 ? t('1 opción') : t('{n} opciones', { n: optionCount })}
          </span>
        ) : null}
      </div>
      {helperText && (
        <p className="-mt-0.5 text-xs text-gray-400">{helperText}</p>
      )}

      {/* Caja del selector: que se vea como UN campo, con la instrucción
          adentro — «elige una» — para que una sola opción no se confunda
          con una etiqueta (pedido de Frank tras agregar Ubicación). */}
      <div className={`rounded-xl border px-3 py-2.5 ${
        selectedItem ? 'border-blue-200 bg-blue-50/40' : 'border-gray-200 bg-gray-50/60'
      }`}>
        {selectedItem ? (
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={15} className="flex-shrink-0 text-blue-600" />
            <span className="text-xs text-blue-700">{t('Seleccionado')}:</span>
            <span className="truncate text-sm font-semibold text-blue-800">{selectedItem.name}</span>
          </div>
        ) : optionCount === 0 ? (
          <p className="text-xs text-gray-500">{t('Todavía no hay opciones. Crea la primera con el botón de abajo.')}</p>
        ) : (
          <p className="text-xs text-gray-500">
            {optionCount === 1
              ? t('Toca la opción para elegirla, o crea una nueva.')
              : t('Toca una opción para elegirla, o crea una nueva.')}
          </p>
        )}

        {showSearch && (
          <div className="relative mt-2">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-lg border border-gray-300 bg-white py-1.5 pl-8 pr-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
            />
          </div>
        )}

        {/* Opciones como «radio»: círculo vacío → elegible; check → elegida.
            Envuelven en varias filas y scrollean en vertical. */}
        {optionCount > 0 && (
          <div className="mt-2 flex max-h-40 flex-wrap content-start gap-2 overflow-y-auto pb-0.5 pr-1">
            {filtered.length === 0 ? (
              <span className="py-1 text-xs text-gray-400 flex-shrink-0">{t('Sin resultados')}</span>
            ) : (
              filtered.map((item) => {
                const active = value === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => onChange(active ? null : item.id)}
                    className={`flex flex-shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      active
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700'
                    }`}
                  >
                    {active
                      ? <CheckCircle2 size={13} className="flex-shrink-0" />
                      : <Circle size={13} className="flex-shrink-0 text-gray-300" />}
                    {item.name}
                  </button>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* Quick-add */}
      {!showForm ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className={`flex w-fit items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
            optionCount === 0
              ? 'border border-blue-300 bg-blue-50 font-semibold text-blue-700 hover:bg-blue-100'
              : 'border border-dashed border-gray-300 text-gray-500 hover:border-blue-500 hover:text-blue-700'
          }`}
        >
          <Plus size={11} />
          {createText}
        </button>
      ) : (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-2.5 space-y-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleCreate())}
            placeholder={namePlaceholder}
            autoFocus
            className="w-full rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20"
          />
          {warning && (
            <div className="flex items-start gap-1.5 rounded-md bg-amber-50 px-2 py-1.5 text-xs text-amber-700 ring-1 ring-amber-200">
              <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
              <span>{warning}</span>
            </div>
          )}
          {extraFields.map((f) => (
            <input
              key={f.name}
              type="text"
              value={extra[f.name] ?? ''}
              onChange={(e) => setExtra((prev) => ({ ...prev, [f.name]: e.target.value }))}
              placeholder={f.placeholder}
              className="w-full rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20"
            />
          ))}
          {createError && (
            <p className="rounded-md bg-red-50 px-2 py-1.5 text-xs text-red-600 ring-1 ring-red-200">
              {createError}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCreate}
              disabled={!newName.trim() || isCreating}
              className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {isCreating ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
              {createButtonText}
            </button>
            <button
              type="button"
              onClick={cancelForm}
              className="rounded-md px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100"
            >
              {t('Cancelar')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
