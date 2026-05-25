import { useState } from 'react'
import { Plus, X, Check, Search, Loader2 } from 'lucide-react'

/**
 * Horizontal scrollable chip picker with inline quick-add form.
 * Parent handles the actual mutation; this component is pure UI.
 */
export default function EntityPicker({
  label,
  items = [],
  value,
  onChange,
  onCreate,
  extraFields = [],
  placeholder = 'Buscar...',
  createLabel = 'Nuevo',
  isCreating = false,
}) {
  const [search, setSearch]     = useState('')
  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName]   = useState('')
  const [extra, setExtra]       = useState({})

  const filtered = items.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase()),
  )

  const selectedItem = items.find((i) => i.id === value)

  const handleCreate = async () => {
    if (!newName.trim()) return
    try {
      await onCreate(newName.trim(), extra)
      setNewName('')
      setExtra({})
      setShowForm(false)
      setSearch('')
    } catch {
      // Parent already logged
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      {/* Label + clear button */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        {selectedItem && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="flex items-center gap-0.5 text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            <X size={11} />
            Quitar
          </button>
        )}
      </div>

      {/* Selected badge */}
      {selectedItem && (
        <div className="flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-1.5">
          <Check size={13} className="text-blue-600 flex-shrink-0" />
          <span className="text-sm font-medium text-blue-700 truncate">{selectedItem.name}</span>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-gray-300 py-1.5 pl-8 pr-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
        />
      </div>

      {/* Horizontal chips */}
      <div className="flex gap-2 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
        {filtered.length === 0 ? (
          <span className="py-1 text-xs text-gray-400 flex-shrink-0">
            {search ? 'Sin resultados' : 'No hay elementos'}
          </span>
        ) : (
          filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(value === item.id ? null : item.id)}
              className={`flex-shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                value === item.id
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300 hover:text-blue-700'
              }`}
            >
              {item.name}
            </button>
          ))
        )}
      </div>

      {/* Quick-add */}
      {!showForm ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex w-fit items-center gap-1 rounded-lg border border-dashed border-gray-300 px-2.5 py-1 text-xs text-gray-500 hover:border-blue-500 hover:text-blue-700 transition-colors"
        >
          <Plus size={11} />
          {createLabel}
        </button>
      ) : (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-2.5 space-y-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleCreate())}
            placeholder="Nombre *"
            autoFocus
            className="w-full rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20"
          />
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
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCreate}
              disabled={!newName.trim() || isCreating}
              className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {isCreating ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
              Crear
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setNewName(''); setExtra({}) }}
              className="rounded-md px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
