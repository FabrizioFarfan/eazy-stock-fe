import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Upload, FileSpreadsheet, AlertTriangle, Loader2, CheckCircle2,
  ChevronRight, ChevronDown, Download, RotateCcw,
} from 'lucide-react'
import { toast } from 'sonner'
import { importsApi } from '../services/endpoints/imports'
import { useAuth } from '../context/AuthContext'
import { getErrorMessage } from '../utils/handleApiError'
import HelpDrawer from '../components/common/HelpDrawer'

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
  salePrice:    'Precio de venta',
  purchasePrice:'Costo de compra',
  currentStock: 'Stock actual',
  supplierName: 'Proveedor',
}

const REQUIRED_FIELDS = ['name', 'sku']

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
      toast.error('Formato no soportado. Usá .xlsx o .csv.')
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
            Arrastrá un Excel o CSV
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
  const [extractFromName, setExtractFromName] = useState(
    upload.extractProviderCodeSuggested ?? false,
  )
  const [duplicateStrategy, setDuplicateStrategy] = useState('SKIP')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [saving, setSaving] = useState(false)

  const mappedFields = useMemo(
    () => Object.values(mapping).filter(Boolean),
    [mapping],
  )
  const missingRequired = REQUIRED_FIELDS.filter((f) => !mappedFields.includes(f))
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
          Asociá cada una con un campo del producto (o elegí "No importar esta columna" si no aplica).
          Nombre y SKU son obligatorios.
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
          <p className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-100">
            <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />
            Faltan campos obligatorios: {missingRequired.map((f) => FIELD_LABELS[f] ?? f).join(', ')}
          </p>
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
            Elegí qué hacer cuando una fila del archivo coincide con un producto que ya tenés.
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
                  Extraer el código del proveedor del nombre
                </p>
                <p className="text-xs text-gray-500">
                  Sólo si tu columna de Nombre trae el código pegado al final, separado por
                  doble espacio (ej. "Abrazadera 1/2 S/Fin   10915"). Lo separamos
                  automáticamente. Si tu archivo ya tiene una columna aparte para el código
                  del proveedor, dejá esto desactivado.
                </p>
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
  const [executing, setExecuting] = useState(false)

  const load = useCallback(async (p) => {
    setLoading(true)
    try {
      const res = await importsApi.preview(jobId, { page: p, size: 50 })
      setData(res.data.data)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [jobId])

  useEffect(() => {
    load(page)
  }, [page, load])

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
      {/* Counters */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Counter label="Totales"      value={totals.totalRows}   color="gray" />
        <Counter label="Listas"       value={totals.greenCount + totals.yellowCount} color="emerald" />
        <Counter label="Advertencias" value={totals.yellowCount} color="amber" />
        <Counter label="Errores"      value={totals.redCount}    color="red" />
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
        <p className="px-2 py-1 text-xs text-gray-500">
          Las filas con error (rojo) NO se importarán. Las filas con warnings (amarillo)
          se importan pero quedan flageadas con una nota para que las revises.
        </p>

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
                    Sin filas
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

function Counter({ label, value, color }) {
  const colorMap = {
    gray:    'border-gray-200 text-gray-900',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    amber:   'border-amber-200 bg-amber-50 text-amber-900',
    red:     'border-red-200 bg-red-50 text-red-900',
  }
  return (
    <div className={`rounded-2xl border bg-white px-4 py-3 shadow-sm ${colorMap[color]}`}>
      <p className="text-xs font-semibold uppercase tracking-widest opacity-70">{label}</p>
      <p className="mt-1 text-2xl font-extrabold">{value}</p>
    </div>
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

function StepHelp({ step }) {
  if (step === 0) return (
    <p>
      Subí tu archivo Excel (.xlsx) o CSV con la lista de productos. El sistema lo va a leer y en
      el siguiente paso vas a mapear las columnas a los campos del sistema. Si tu archivo viene
      del sistema viejo de inventario, asegurate de tenerlo a la mano antes de empezar.
    </p>
  )
  if (step === 1) return (
    <p>
      Cada columna de tu archivo se mapea a un campo del sistema. Auto-detectamos los nombres
      comunes (NOMBRE → Nombre, PRECIO → Precio de venta, etc.) pero podés ajustar manualmente.
      Si una columna de tu archivo no la querés importar, elegí "No importar esta columna". Los
      campos obligatorios son: <span className="font-semibold">Nombre</span> y{' '}
      <span className="font-semibold">SKU</span>. El resto son opcionales.
    </p>
  )
  if (step === 2) return (
    <>
      <p>Acá ves cómo van a quedar los productos antes de importar. Cada fila tiene un color:</p>
      <ul className="ml-1 space-y-1">
        <li><span className="font-semibold text-emerald-700">Verde</span>: la fila se va a importar sin problemas.</li>
        <li><span className="font-semibold text-amber-700">Amarillo</span>: la fila se va a importar pero con una observación que te recomendamos revisar después.</li>
        <li><span className="font-semibold text-red-700">Rojo</span>: la fila NO se va a importar porque le falta información obligatoria.</li>
      </ul>
      <p>
        Los amarillos son OK — el sistema importa el producto y le agrega una nota para que después
        lo revises desde la página de Productos. Los rojos sí los tenés que arreglar en tu archivo
        o ya no importarlos.
      </p>
      <p className="font-semibold text-gray-800">Observaciones comunes:</p>
      <ul className="ml-1 space-y-1.5">
        <li><span className="font-semibold">Sin proveedor</span>: el producto se importa pero queda con proveedor "Sin proveedor asignado". Después podés asignar el proveedor real desde la edición del producto.</li>
        <li><span className="font-semibold">Costo en 0</span>: el sistema te avisa para que actualices el costo cuando recibas la próxima compra.</li>
        <li><span className="font-semibold">Stock negativo</span>: como el sistema no permite stock negativo, se guarda como 0 y te queda una nota.</li>
        <li><span className="font-semibold">Costo mayor al precio de venta</span>: probablemente un error de carga, te lo señalamos para que lo revises.</li>
        <li><span className="font-semibold">Precio variable</span>: tu producto se guarda con el flag "Precio variable" y cada vez que lo vendas, te pedimos el precio en el momento.</li>
        <li><span className="font-semibold">Caracteres corregidos</span>: tu archivo tenía caracteres mal codificados (como "Ã±" en vez de "ñ") y los corregimos automáticamente.</li>
      </ul>
    </>
  )
  return (
    <>
      <p>Listo. Estos son los resultados del import:</p>
      <ul className="ml-1 space-y-1">
        <li>Cuántos productos se importaron.</li>
        <li>Cuántos proveedores nuevos se crearon.</li>
        <li>Cuántas filas con observaciones (revisalas después en Productos, vas a ver cada una con su nota).</li>
      </ul>
      <p>Si querés ver el detalle por fila, descargá el reporte completo en Excel.</p>
    </>
  )
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function ProductImportPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [step, setStep] = useState(0)
  const [upload, setUpload] = useState(null) // { jobId, headers, ... }

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
        <HelpDrawer title={STEP_HELP_TITLES[step]}>
          <StepHelp step={step} />
        </HelpDrawer>
      </div>

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
