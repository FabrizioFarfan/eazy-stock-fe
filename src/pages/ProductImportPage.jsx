import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Upload, FileSpreadsheet, AlertTriangle, Loader2, CheckCircle2,
  ChevronRight, ChevronDown, Download, RotateCcw, History,
} from 'lucide-react'
import { toast } from 'sonner'
import { importsApi } from '../services/endpoints/imports'
import { useAuth } from '../context/AuthContext'
import { getErrorMessage } from '../utils/handleApiError'
import HelpDrawer from '../components/common/HelpDrawer'
import ImportHistoryModal from '../components/products/ImportHistoryModal'

const STEP_LABELS = [
  'Subir archivo',
  'Mapear columnas',
  'Revisar',
  'Importar',
]

const FIELD_OPTIONS = [
  { value: '',             label: 'No importar esta columna' },
  { value: 'name',         label: 'Nombre del producto (obligatorio)' },
  { value: 'sku',          label: 'Código interno / SKU (obligatorio)' },
  { value: 'providerCode', label: 'Código del proveedor (el del catálogo del proveedor)' },
  { value: 'barcode',      label: 'Código de barras (EAN del empaque, el de fábrica)' },
  { value: 'salePrice',    label: 'Precio de venta' },
  { value: 'purchasePrice',label: 'Costo de compra' },
  { value: 'currentStock', label: 'Stock actual' },
  { value: 'supplierName', label: 'Proveedor' },
]

// Nombres legibles para los mensajes de validación (no mostrar las claves crudas).
const FIELD_LABELS = {
  name:         'Nombre del producto',
  sku:          'Código interno / SKU',
  providerCode: 'Código del proveedor',
  barcode:      'Código de barras',
  salePrice:    'Precio de venta',
  purchasePrice:'Costo de compra',
  currentStock: 'Stock actual',
  supplierName: 'Proveedor',
}

// Solo el nombre es obligatorio: el SKU se autogenera si el archivo no lo trae.
const REQUIRED_FIELDS = ['name']

// ── Stepper ─────────────────────────────────────────────────────────────────

function Stepper({ current }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
      {STEP_LABELS.map((label, idx) => {
        const isDone = idx < current
        const isActive = idx === current
        return (
          <div key={label} className="flex items-center gap-2">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
              isDone ? 'bg-emerald-500 text-white' :
              isActive ? 'bg-blue-600 text-white' :
              'bg-gray-200 text-gray-500'
            }`}>
              {isDone ? <CheckCircle2 size={14} /> : idx + 1}
            </div>
            <span className={`text-sm font-medium ${
              isActive ? 'text-gray-900' : isDone ? 'text-emerald-700' : 'text-gray-400'
            }`}>
              {label}
            </span>
            {idx < STEP_LABELS.length - 1 && (
              <ChevronRight size={14} className="text-gray-300" />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Step 1 — Upload ─────────────────────────────────────────────────────────

function UploadStep({ onUploaded }) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)

  const handleFile = async (file) => {
    if (!file) return
    const isXlsx = file.name.toLowerCase().endsWith('.xlsx')
    const isCsv  = file.name.toLowerCase().endsWith('.csv')
    if (!isXlsx && !isCsv) {
      toast.error('Formato no soportado. Usa .xlsx o .csv.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Archivo muy grande (máx 10MB).')
      return
    }
    try {
      setUploading(true)
      const res = await importsApi.upload(file)
      onUploaded(res.data.data)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0])
        }}
        className={`flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed py-12 transition-colors ${
          dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50/60'
        }`}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100">
          <FileSpreadsheet size={32} className="text-blue-600" />
        </div>
        <div className="text-center">
          <p className="text-base font-semibold text-gray-900">
            Arrastra un Excel o CSV
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Formatos .xlsx o .csv hasta 10MB · El sistema detecta columnas automáticamente
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.csv"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          {uploading ? 'Subiendo...' : 'Seleccionar archivo'}
        </button>
      </div>
    </div>
  )
}

// ── Step 2 — Mapping ────────────────────────────────────────────────────────

function MappingStep({ upload, onSaved, onBack }) {
  const [mapping, setMapping] = useState(upload.suggestedMapping ?? {})
  // Siempre desactivado por defecto: casi ningún Excel trae el código pegado al
  // nombre. Es una opción avanzada manual (sobre todo para re-importar un export
  // con la columna "Nombre + código (SKU)").
  const [extractFromName, setExtractFromName] = useState(false)
  const [duplicateStrategy, setDuplicateStrategy] = useState('SKIP')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [saving, setSaving] = useState(false)

  const mappedFields = useMemo(
    () => Object.values(mapping).filter(Boolean),
    [mapping],
  )
  // El SKU puede venir embebido en el Nombre: si está activa la opción avanzada
  // y hay una columna mapeada a Nombre, el SKU se extrae de ahí → requisito cumplido.
  const skuFromName = extractFromName && mappedFields.includes('name')
  const missingRequired = REQUIRED_FIELDS.filter((f) => {
    if (f === 'sku' && skuFromName) return false
    return !mappedFields.includes(f)
  })
  const dupFields = useMemo(() => {
    const counts = {}
    mappedFields.forEach((f) => { counts[f] = (counts[f] || 0) + 1 })
    return Object.entries(counts).filter(([, c]) => c > 1).map(([f]) => f)
  }, [mappedFields])

  const canContinue = missingRequired.length === 0 && dupFields.length === 0

  const handleSave = async () => {
    try {
      setSaving(true)
      await importsApi.submitMapping(upload.jobId, {
        columnMapping: Object.fromEntries(
          Object.entries(mapping).filter(([, v]) => !!v),
        ),
        extractProviderCodeFromName: extractFromName,
        duplicateStrategy,
      })
      onSaved({ extractFromName, duplicateStrategy })
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900">Mapear columnas del archivo</h3>
        <p className="mt-1 text-xs text-gray-500">
          Detectamos {upload.headers.length} columna{upload.headers.length !== 1 ? 's' : ''}.
          Asocia cada una con un campo del producto (o elige "No importar esta columna" si no aplica).
          Solo el Nombre es obligatorio — si falta el código, proveedor, stock o precio, el sistema
          los completa automáticamente.
        </p>

        <div className="mt-4 overflow-hidden rounded-xl border border-gray-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-widest text-gray-400">
                <th className="px-4 py-2.5 text-left font-semibold">Columna del archivo</th>
                <th className="px-4 py-2.5 text-left font-semibold">Campo del producto</th>
              </tr>
            </thead>
            <tbody>
              {upload.headers.map((header) => (
                <tr key={header} className="border-b border-gray-50">
                  <td className="px-4 py-2.5 font-medium text-gray-900">{header}</td>
                  <td className="px-4 py-2.5">
                    <select
                      value={mapping[header] ?? ''}
                      onChange={(e) =>
                        setMapping((m) => ({ ...m, [header]: e.target.value }))
                      }
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                    >
                      {FIELD_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {missingRequired.length > 0 && (
          <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-100">
            <p className="flex items-start gap-2">
              <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />
              Faltan campos obligatorios: {missingRequired.map((f) => FIELD_LABELS[f] ?? f).join(', ')}
            </p>
            {missingRequired.includes('sku') && mappedFields.includes('name') && (
              <p className="mt-1.5 pl-5 text-amber-700">
                ¿Tu columna de Nombre ya incluye el código (SKU) al final? Mapéala a "Nombre del
                producto" y activa <span className="font-semibold">"El nombre trae el código pegado
                al final"</span> en Opciones avanzadas — así el SKU se toma de ahí.
              </p>
            )}
          </div>
        )}
        {dupFields.length > 0 && (
          <p className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-100">
            <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />
            Campos duplicados: {dupFields.map((f) => FIELD_LABELS[f] ?? f).join(', ')}. Cada campo solo puede asignarse a una columna.
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900">Opciones</h3>

        <div className="mt-3">
          <p className="text-sm font-semibold text-gray-900">
            Si el SKU ya existe en tu inventario
          </p>
          <p className="text-xs text-gray-500">
            Elige qué hacer cuando una fila del archivo coincide con un producto que ya tienes.
          </p>
          <div className="mt-2 space-y-2">
            {[
              { value: 'SKIP',    label: 'Saltar', desc: 'No tocar el producto existente (recomendado)' },
              { value: 'UPDATE',  label: 'Actualizar', desc: 'Actualizar nombre, precios, proveedor — mantener stock actual' },
              { value: 'REPLACE', label: 'Reemplazar', desc: 'Actualizar todo Y resetear el stock al valor del archivo' },
            ].map((opt) => (
              <label key={opt.value}
                className={`flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 transition-colors ${
                  duplicateStrategy === opt.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}>
                <input
                  type="radio"
                  name="dup-strategy"
                  value={opt.value}
                  checked={duplicateStrategy === opt.value}
                  onChange={(e) => setDuplicateStrategy(e.target.value)}
                  className="mt-0.5 accent-blue-600"
                />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{opt.label}</p>
                  <p className="text-xs text-gray-500">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Opciones avanzadas — colapsadas por defecto. Sólo casos raros. */}
        <div className="mt-4 border-t border-gray-100 pt-3">
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700"
          >
            <ChevronDown size={14} className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            Opciones avanzadas
          </button>

          {showAdvanced && (
            <label className="mt-3 flex cursor-pointer items-start gap-2 rounded-lg border border-gray-200 px-3 py-2.5 hover:bg-gray-50">
              <input
                type="checkbox"
                checked={extractFromName}
                onChange={(e) => setExtractFromName(e.target.checked)}
                className="mt-0.5 accent-blue-600"
              />
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  El nombre trae el código (SKU) pegado al final
                </p>
                <p className="text-xs text-gray-500">
                  Actívalo si tu columna de Nombre incluye el código al final, separado por doble
                  espacio (por ejemplo "Abrazadera 1/2 S/Fin  10915"). Es el caso típico al
                  re-importar un archivo que exportaste con la columna "Nombre + código (SKU)".
                </p>
                <p className="mt-1 text-xs font-medium text-blue-700">
                  Con esta opción activada basta con mapear la columna de Nombre: el código del
                  final se usa como SKU, así que NO necesitas una columna de SKU aparte.
                </p>
                {extractFromName && skuFromName && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 size={12} /> Listo: el SKU se tomará del nombre. Ya no falta nada por mapear.
                  </p>
                )}
                {extractFromName && !mappedFields.includes('name') && (
                  <p className="mt-1.5 text-xs font-semibold text-amber-700">
                    Falta mapear una columna a "Nombre del producto" para poder extraer el SKU.
                  </p>
                )}
              </div>
            </label>
          )}
        </div>
      </div>

      <div className="flex justify-between">
        <button onClick={onBack}
          className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
          Atrás
        </button>
        <button
          onClick={handleSave}
          disabled={!canContinue || saving}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50">
          {saving && <Loader2 size={14} className="animate-spin" />}
          {saving ? 'Guardando...' : 'Continuar'}
        </button>
      </div>
    </div>
  )
}

// ── Step 3 — Preview ────────────────────────────────────────────────────────

const COLOR_BY_CLASS = {
  GREEN:  'bg-emerald-50',
  YELLOW: 'bg-amber-50',
  RED:    'bg-red-50',
}
const TEXT_BY_CLASS = {
  GREEN:  'text-emerald-700',
  YELLOW: 'text-amber-700',
  RED:    'text-red-700',
}

function PreviewStep({ jobId, onExecute, onBack }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [filter, setFilter] = useState(null) // null | 'YELLOW' | 'RED'
  const [executing, setExecuting] = useState(false)

  const load = useCallback(async (p, f) => {
    setLoading(true)
    try {
      const res = await importsApi.preview(jobId, { page: p, size: 50, ...(f && { filter: f }) })
      setData(res.data.data)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [jobId])

  useEffect(() => {
    load(page, filter)
  }, [page, filter, load])

  // Cambiar de filtro siempre vuelve a la primera página (la paginación es del backend).
  const changeFilter = (f) => { setPage(0); setFilter(f) }

  const totals = data ?? { totalRows: 0, greenCount: 0, yellowCount: 0, redCount: 0 }
  const rows = data?.rows?.content ?? []
  const totalPages = data?.rows?.totalPages ?? 0
  const hasErrors = totals.redCount > 0

  const handleExecute = async () => {
    if (hasErrors && !window.confirm(
      `Hay ${totals.redCount} fila(s) con errores que NO se importarán. ¿Continuar igual?`)) return
    try {
      setExecuting(true)
      await importsApi.execute(jobId)
      onExecute()
    } catch (err) {
      toast.error(getErrorMessage(err))
      setExecuting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Counters — Advertencias y Errores filtran la tabla; Totales la limpia */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Counter label="Totales"      value={totals.totalRows} color="gray"
          onClick={() => changeFilter(null)} active={filter === null}
          hint="Ver todas las filas" />
        <Counter label="Listas"       value={totals.greenCount + totals.yellowCount} color="emerald" />
        <Counter label="Advertencias" value={totals.yellowCount} color="amber"
          onClick={() => changeFilter('YELLOW')} active={filter === 'YELLOW'}
          hint="Ver solo las filas con advertencias" />
        <Counter label="Errores"      value={totals.redCount} color="red"
          onClick={() => changeFilter('RED')} active={filter === 'RED'}
          hint="Ver solo las filas con errores" />
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 px-2 py-1">
          <p className="text-xs text-gray-500">
            Las filas con error (rojo) NO se importarán. Las filas con advertencia (amarillo)
            se importan pero quedan marcadas con una nota para que las revises.
          </p>
          {filter && (
            <button
              type="button"
              onClick={() => changeFilter(null)}
              className="flex flex-shrink-0 items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-200"
            >
              Mostrando solo {filter === 'YELLOW' ? 'advertencias' : 'errores'} · Ver todas ✕
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase tracking-widest text-gray-400">
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">Nombre</th>
                <th className="px-3 py-2 text-left">SKU</th>
                <th className="px-3 py-2 text-right">P. Venta</th>
                <th className="px-3 py-2 text-right">Costo</th>
                <th className="px-3 py-2 text-right">Stock</th>
                <th className="px-3 py-2 text-left">Proveedor</th>
                <th className="px-3 py-2 text-left">Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j} className="px-3 py-2">
                        <div className="h-4 animate-pulse rounded bg-gray-100" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-sm text-gray-400">
                    {filter === 'YELLOW' ? 'No hay filas con advertencias 🎉'
                      : filter === 'RED' ? 'No hay filas con errores 🎉'
                      : 'Sin filas'}
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.rowNumber} className={`border-b border-gray-50 ${COLOR_BY_CLASS[r.classification] ?? ''}`}>
                    <td className="px-3 py-2 font-mono text-xs text-gray-500">{r.rowNumber}</td>
                    <td className="max-w-[220px] truncate px-3 py-2 font-medium text-gray-900">{r.name || '—'}</td>
                    <td className="px-3 py-2 font-mono text-xs text-gray-700">{r.sku || '—'}</td>
                    <td className="px-3 py-2 text-right text-gray-700">
                      {r.priceIsVariable ? (
                        <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-orange-700">
                          Variable
                        </span>
                      ) : (
                        r.salePrice ?? '—'
                      )}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-700">{r.purchasePrice ?? '—'}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{r.currentStock ?? '—'}</td>
                    <td className="max-w-[160px] truncate px-3 py-2 text-gray-600">
                      {r.supplierName ?? <span className="text-amber-700">Sin asignar</span>}
                    </td>
                    <td className={`px-3 py-2 text-xs ${TEXT_BY_CLASS[r.classification] ?? ''}`}>
                      {r.issues.length > 0 ? r.issues.join(' · ') : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-3 py-2">
            <p className="text-xs text-gray-500">
              Página {page + 1} / {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                Anterior
              </button>
              <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <button onClick={onBack}
          className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
          Atrás
        </button>
        <button
          onClick={handleExecute}
          disabled={executing || totals.totalRows === 0}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50">
          {executing && <Loader2 size={14} className="animate-spin" />}
          Importar {totals.greenCount + totals.yellowCount} producto(s)
        </button>
      </div>
    </div>
  )
}

function Counter({ label, value, color, onClick, active, hint }) {
  const colorMap = {
    gray:    'border-gray-200 text-gray-900',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    amber:   'border-amber-200 bg-amber-50 text-amber-900',
    red:     'border-red-200 bg-red-50 text-red-900',
  }
  const ringMap = {
    gray:    'ring-gray-400',
    emerald: 'ring-emerald-500',
    amber:   'ring-amber-500',
    red:     'ring-red-500',
  }
  const clickable = typeof onClick === 'function'
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!clickable}
      title={hint}
      className={`rounded-2xl border bg-white px-4 py-3 text-left shadow-sm transition ${colorMap[color]} ${
        clickable ? 'cursor-pointer hover:shadow-md' : 'cursor-default'
      } ${active ? `ring-2 ${ringMap[color]}` : ''}`}
    >
      <p className="text-xs font-semibold uppercase tracking-widest opacity-70">{label}</p>
      <p className="mt-1 text-2xl font-extrabold">{value}</p>
    </button>
  )
}

// ── Step 4 — Importing / Result ─────────────────────────────────────────────

function ImportingStep({ jobId, onDone, onRestart }) {
  const [status, setStatus] = useState(null)
  const [downloading, setDownloading] = useState(false)
  const navigate = useNavigate()
  const intervalRef = useRef(null)

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await importsApi.getStatus(jobId)
        setStatus(res.data.data)
        if (res.data.data.status === 'COMPLETED' || res.data.data.status === 'FAILED') {
          if (intervalRef.current) clearInterval(intervalRef.current)
          onDone(res.data.data)
        }
      } catch {
        // si falla un poll lo intentamos en el próximo tick
      }
    }
    poll()
    intervalRef.current = setInterval(poll, 2000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId])

  const summary = useMemo(() => {
    if (!status?.resultSummary) return null
    try { return JSON.parse(status.resultSummary) } catch { return null }
  }, [status])

  const progress = status && status.totalRows > 0
    ? Math.round((status.processedRows / status.totalRows) * 100)
    : 0

  const isDone = status?.status === 'COMPLETED'
  const isFailed = status?.status === 'FAILED'

  const handleDownload = async () => {
    try {
      setDownloading(true)
      const res = await importsApi.downloadReport(jobId)
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `import-${jobId}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">
            {isDone   ? '¡Importación completada!' :
             isFailed ? 'La importación falló' :
             'Importando productos...'}
          </h3>
          {!isDone && !isFailed && <Loader2 size={16} className="animate-spin text-blue-600" />}
        </div>

        <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full transition-all ${isFailed ? 'bg-red-500' : 'bg-blue-600'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-gray-500">
          {status?.processedRows ?? 0} / {status?.totalRows ?? 0} filas ·{' '}
          <span className="text-emerald-600">{status?.successCount ?? 0} correctas</span> ·{' '}
          <span className="text-amber-600">{status?.warningCount ?? 0} advertencias</span> ·{' '}
          <span className="text-red-600">{status?.errorCount ?? 0} errores</span>
        </p>
      </div>

      {isDone && summary && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900">Resumen</h3>

          <ul className="mt-3 space-y-1.5 text-sm">
            <SummaryRow label="Productos creados"            value={summary.productsCreated} />
            <SummaryRow label="Productos actualizados"       value={summary.productsUpdated} />
            <SummaryRow label="Productos saltados"           value={summary.productsSkipped} />
            <SummaryRow label="Proveedores nuevos creados"   value={summary.suppliersCreated} />
            <SummaryRow label="Proveedores deduplicados"     value={summary.suppliersDeduplicated}
              hint="Mismo nombre con distinta capitalización" />
            <SummaryRow label="Caracteres corregidos"        value={summary.encodingCleaned} />
            <SummaryRow label="Stock negativo normalizado"   value={summary.negativeStockNormalized} />
            <SummaryRow label="Productos con precio variable" value={summary.variablePrice} />
            <SummaryRow label="Productos con costo en 0"     value={summary.zeroPurchasePrice} />
            <SummaryRow label="Costo > precio venta"         value={summary.costAboveSale} />
            <SummaryRow label="Asignados a 'Sin proveedor'"  value={summary.assignedToPlaceholder} />
            <SummaryRow label="Filas con error"              value={summary.rowsFailed}
              danger={summary.rowsFailed > 0} />
          </ul>

          {summary.negativeStockSkus?.length > 0 && (
            <SkuList title="Stock negativo — revisar" skus={summary.negativeStockSkus} />
          )}
          {summary.costAboveSaleSkus?.length > 0 && (
            <SkuList title="Costo > precio venta — revisar" skus={summary.costAboveSaleSkus} />
          )}
        </div>
      )}

      {isFailed && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          <p className="font-semibold">La importación no pudo completarse.</p>
          <p className="mt-1 text-xs">
            {summary?.error ?? 'Error desconocido. Revisá los logs del servidor.'}
          </p>
        </div>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        {(isDone || isFailed) && (
          <>
            <button onClick={onRestart}
              className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
              <RotateCcw size={14} />
              Importar otro archivo
            </button>
            <button onClick={handleDownload} disabled={downloading}
              className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50">
              {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              Descargar reporte
            </button>
            <button onClick={() => navigate('/products')}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              Ver productos
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function SummaryRow({ label, value, hint, danger }) {
  return (
    <li className="flex items-center justify-between border-b border-gray-50 py-1">
      <div>
        <span className="text-gray-700">{label}</span>
        {hint && <span className="ml-2 text-xs text-gray-400">{hint}</span>}
      </div>
      <span className={`font-mono font-semibold ${danger ? 'text-red-600' : 'text-gray-900'}`}>
        {value ?? 0}
      </span>
    </li>
  )
}

function SkuList({ title, skus }) {
  return (
    <div className="mt-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">{title}</p>
      <div className="mt-1 flex flex-wrap gap-1">
        {skus.map((s) => (
          <span key={s} className="rounded-full bg-amber-100 px-2 py-0.5 font-mono text-[11px] text-amber-700">
            {s}
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Ayuda contextual por paso ─────────────────────────────────────────────────

const STEP_HELP_TITLES = [
  'Subir el archivo',
  'Mapear las columnas',
  'Revisar antes de importar',
  'Resultado del import',
]

function HelpSection({ title, children }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3">
      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-gray-500">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function StepHelp({ step }) {
  if (step === 0) return (
    <>
      <p>
        Este es el primer paso para cargar muchos productos de una sola vez, en lugar de
        crearlos uno por uno.
      </p>
      <HelpSection title="Qué hacer">
        <p>
          Arrastra (o selecciona) tu archivo <span className="font-semibold">Excel (.xlsx)</span> o{' '}
          <span className="font-semibold">CSV</span> con la lista de productos. Pesa hasta 10 MB.
          El sistema lo lee al instante y en el siguiente paso eliges qué columna corresponde a
          qué campo.
        </p>
      </HelpSection>
      <HelpSection title="Antes de empezar">
        <p>
          Si el archivo viene de tu sistema anterior de inventario, tenlo a la mano. No necesitas
          darle ningún formato especial: el sistema reconoce los encabezados más comunes y tú
          ajustas el resto en el paso siguiente.
        </p>
      </HelpSection>
      <p className="text-xs text-gray-400">
        Tranquilo: nada se guarda todavía. Recién al final, después de revisar, decides importar.
      </p>
    </>
  )
  if (step === 1) return (
    <>
      <p>
        Cada columna de tu archivo se conecta con un campo del producto. El sistema ya intentó
        adivinar las más comunes (por ejemplo NOMBRE → Nombre, PRECIO → Precio de venta), pero
        puedes corregir cualquiera a mano.
      </p>
      <HelpSection title="Campos obligatorios">
        <p>
          Solo uno: <span className="font-semibold">Nombre</span>. Todo lo demás es opcional
          y las celdas vacías no son problema:
        </p>
        <ul className="space-y-1">
          <li>• <span className="font-semibold">Sin código (SKU)</span>: el sistema le genera uno automático.</li>
          <li>• <span className="font-semibold">Sin proveedor</span>: queda como "Sin proveedor asignado" y lo completas después.</li>
          <li>• <span className="font-semibold">Sin stock</span>: se guarda con stock 0.</li>
          <li>• <span className="font-semibold">Sin precio</span> (ej. productos por kilo/gramo): queda como "Precio variable" y el precio se pone al vender.</li>
        </ul>
      </HelpSection>
      <HelpSection title="Columnas que no quieres importar">
        <p>
          Elige <span className="font-semibold">"No importar esta columna"</span> y esa columna se
          ignora por completo. Útil para columnas internas que no aplican al sistema.
        </p>
      </HelpSection>
      <HelpSection title="Opciones avanzadas">
        <p>
          Solo si tu columna de Nombre trae el código pegado al final (caso poco común). Lo normal
          es dejarlas como están.
        </p>
      </HelpSection>
    </>
  )
  if (step === 2) return (
    <>
      <p>
        Aquí ves exactamente cómo quedará cada producto <span className="font-semibold">antes</span>{' '}
        de guardarlo. Cada fila tiene un color según su estado:
      </p>
      <HelpSection title="Qué significa cada color">
        <ul className="space-y-1.5">
          <li>🟢 <span className="font-semibold text-emerald-700">Verde</span>: se importa sin problemas.</li>
          <li>🟡 <span className="font-semibold text-amber-700">Amarillo</span>: se importa igual, pero con una observación que conviene revisar después.</li>
          <li>🔴 <span className="font-semibold text-red-700">Rojo</span>: NO se importa porque le falta el nombre del producto.</li>
        </ul>
      </HelpSection>
      <p>
        Lo importante: <span className="font-semibold">los amarillos están bien</span>. El sistema
        guarda el producto y le deja una nota para que lo revises con calma desde la página de
        Productos. Los rojos sí debes corregirlos en tu archivo (o no importarlos).
      </p>
      <HelpSection title="Observaciones más comunes (amarillas)">
        <ul className="space-y-2">
          <li><span className="font-semibold">Sin código (SKU)</span>: se importa igual y el sistema le genera un código automático.</li>
          <li><span className="font-semibold">Sin proveedor</span>: el producto se importa con el proveedor "Sin proveedor asignado". Luego le asignas el real desde la edición del producto.</li>
          <li><span className="font-semibold">Costo en 0</span>: te avisamos para que actualices el costo cuando recibas la próxima compra.</li>
          <li><span className="font-semibold">Stock negativo</span>: como no se permite stock negativo, se guarda en 0 y te queda la nota.</li>
          <li><span className="font-semibold">Costo mayor al precio de venta</span>: suele ser un error de carga; te lo marcamos para que lo revises y no vendas a pérdida.</li>
          <li><span className="font-semibold">Precio variable</span>: el producto queda marcado como "Precio variable"; cada vez que lo vendas te pediremos el precio en el momento.</li>
          <li><span className="font-semibold">Caracteres corregidos</span>: tu archivo traía caracteres mal codificados (como "Ã±" en vez de "ñ") y los arreglamos automáticamente.</li>
        </ul>
      </HelpSection>
    </>
  )
  return (
    <>
      <p>¡Listo! El import terminó. En el resumen ves:</p>
      <HelpSection title="Qué muestra el resumen">
        <ul className="space-y-1">
          <li>Cuántos productos se crearon, actualizaron o saltaron.</li>
          <li>Cuántos proveedores nuevos se crearon automáticamente.</li>
          <li>Cuántas filas quedaron con observaciones para revisar.</li>
        </ul>
      </HelpSection>
      <HelpSection title="Tus próximos pasos">
        <p>
          Las filas con observación quedaron en Productos con su nota; revísalas cuando puedas.
          Si quieres el detalle fila por fila, descarga el{' '}
          <span className="font-semibold">reporte completo en Excel</span>: cada producto aparece con
          su color y el motivo de la observación, ideal como lista de pendientes.
        </p>
      </HelpSection>
    </>
  )
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function ProductImportPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [step, setStep] = useState(0)
  const [upload, setUpload] = useState(null) // { jobId, headers, ... }
  const [showHistory, setShowHistory] = useState(false)

  // EMPLOYEE no debería llegar acá, pero por las dudas redirigir.
  useEffect(() => {
    if (user && user.role === 'EMPLOYEE') {
      navigate('/products', { replace: true })
    }
  }, [user, navigate])

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/products')}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Volver</span>
          </button>
          <h2 className="text-2xl font-bold text-gray-900">Importar productos desde Excel</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <History size={14} />
            <span className="hidden sm:inline">Historial</span>
          </button>
          <HelpDrawer title={STEP_HELP_TITLES[step]} autoOpenKey={`eazystock_import_help_v1_step${step}`}>
            <StepHelp step={step} />
          </HelpDrawer>
        </div>
      </div>

      {showHistory && <ImportHistoryModal onClose={() => setShowHistory(false)} />}

      <Stepper current={step} />

      {step === 0 && (
        <UploadStep onUploaded={(u) => { setUpload(u); setStep(1) }} />
      )}

      {step === 1 && upload && (
        <MappingStep
          upload={upload}
          onSaved={() => setStep(2)}
          onBack={() => setStep(0)}
        />
      )}

      {step === 2 && upload && (
        <PreviewStep
          jobId={upload.jobId}
          onExecute={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}

      {step === 3 && upload && (
        <ImportingStep
          jobId={upload.jobId}
          onDone={() => { /* no-op — el componente maneja su propio fin */ }}
          onRestart={() => { setUpload(null); setStep(0) }}
        />
      )}
    </div>
  )
}
