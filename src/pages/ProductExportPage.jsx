import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Download, Loader2, CheckCircle2, ChevronRight, FileSpreadsheet, RotateCcw, AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import { exportsApi } from '../services/endpoints/exports'
import { useSuppliers } from '../hooks/useSuppliers'
import { useCategories } from '../hooks/useCategories'
import { useAuth } from '../context/AuthContext'
import { getErrorMessage } from '../utils/handleApiError'
import HelpDrawer from '../components/common/HelpDrawer'
import { useT } from '../i18n'

const STEP_LABELS = ['Configurar', 'Descargar']

// Las keys coinciden con ProductExportColumn del backend. El orden acá es el
// orden en que se exportan las columnas.
const COLUMN_OPTIONS = [
  { key: 'sku',             label: 'SKU',                            def: true },
  { key: 'name',            label: 'Nombre',                         def: true },
  { key: 'nameWithSku',     label: 'Nombre + código (SKU) juntos',   def: false },
  { key: 'providerCode',    label: 'Código del proveedor',           def: true },
  { key: 'barcode',         label: 'Código de barras',               def: false },
  { key: 'supplierName',    label: 'Proveedor',                      def: true },
  { key: 'brandName',       label: 'Marca',                          def: false },
  { key: 'categoryName',    label: 'Categoría',                      def: false },
  { key: 'presentation',    label: 'Presentación',                   def: false },
  { key: 'salePrice',       label: 'Precio de venta',                def: true },
  { key: 'purchasePrice',   label: 'Costo de compra',                def: true },
  { key: 'currentStock',    label: 'Stock actual',                   def: true },
  { key: 'minStock',        label: 'Stock mínimo',                   def: false },
  { key: 'priceIsVariable', label: 'Precio variable (Sí/No)',        def: false },
  { key: 'importNotes',     label: 'Notas de importación',           def: false },
  { key: 'createdAt',       label: 'Fecha de creación',              def: false },
  { key: 'updatedAt',       label: 'Fecha de última actualización',  def: false },
]

const STATUS_OPTIONS = [
  { value: 'ACTIVE',   label: 'Activos' },
  { value: 'INACTIVE', label: 'Inactivos' },
  { value: 'ALL',      label: 'Todos' },
]
const STOCK_OPTIONS = [
  { value: 'ALL',           label: 'Todos' },
  { value: 'WITH_STOCK',    label: 'Con stock' },
  { value: 'WITHOUT_STOCK', label: 'Sin stock' },
  { value: 'LOW_STOCK',     label: 'Bajo el mínimo' },
]

// ── Stepper ─────────────────────────────────────────────────────────────────

function Stepper({ current }) {
  const t = useT()
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
              {t(label)}
            </span>
            {idx < STEP_LABELS.length - 1 && <ChevronRight size={14} className="text-gray-300" />}
          </div>
        )
      })}
    </div>
  )
}

// ── Step 1 — Configure ────────────────────────────────────────────────────────

function ConfigureStep({ onStarted }) {
  const t = useT()
  const { user } = useAuth()
  const businessId = user?.role === 'SUPER_ADMIN' ? user?.businessId : undefined

  const { data: suppliersData } = useSuppliers({ size: 200, ...(businessId && { businessId }) })
  const { data: categoriesData } = useCategories({ size: 200, ...(businessId && { businessId }) })
  const suppliers = suppliersData?.content ?? []
  const categories = categoriesData?.content ?? []

  const [supplierId, setSupplierId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [status, setStatus] = useState('ACTIVE')
  const [stock, setStock] = useState('ALL')
  const [format, setFormat] = useState('XLSX')
  const [columns, setColumns] = useState(
    () => Object.fromEntries(COLUMN_OPTIONS.map((c) => [c.key, c.def])),
  )
  const [starting, setStarting] = useState(false)

  const selectedKeys = useMemo(
    () => COLUMN_OPTIONS.filter((c) => columns[c.key]).map((c) => c.key),
    [columns],
  )

  // Para que el archivo se pueda volver a importar tiene que poder identificar
  // cada producto: SKU + Nombre por separado, o la columna combinada.
  const reimportable = (columns.sku && columns.name) || columns.nameWithSku

  const toggleColumn = (key) => setColumns((c) => ({ ...c, [key]: !c[key] }))

  const handleGenerate = async () => {
    if (selectedKeys.length === 0) {
      toast.error(t('Elige al menos una columna para exportar'))
      return
    }
    if (!reimportable) {
      toast.error(t('Incluye SKU y Nombre, o la columna "Nombre + código (SKU)", para que el archivo se pueda volver a importar'))
      return
    }
    try {
      setStarting(true)
      const res = await exportsApi.start({
        supplierId: supplierId || null,
        categoryId: categoryId || null,
        status,
        stock,
        columns: selectedKeys,
        format,
      })
      onStarted(res.data.data.jobId)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setStarting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900">{t('Filtros (opcionales)')}</h3>
        <p className="mt-1 text-xs text-gray-500">
          {t('Elige qué productos exportar. Por defecto se exportan los activos.')}
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-600">{t('Proveedor')}</span>
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className={selectCls}>
              <option value="">{t('Todos los proveedores')}</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-600">{t('Categoría')}</span>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={selectCls}>
              <option value="">{t('Todas las categorías')}</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-600">{t('Estado')}</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectCls}>
              {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{t(o.label)}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-600">{t('Stock')}</span>
            <select value={stock} onChange={(e) => setStock(e.target.value)} className={selectCls}>
              {STOCK_OPTIONS.map((o) => <option key={o.value} value={o.value}>{t(o.label)}</option>)}
            </select>
          </label>
        </div>
      </div>

      {/* Columnas */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900">{t('Columnas a incluir')}</h3>
        <p className="mt-1 text-xs text-gray-500">
          {t('Si vas a editar el archivo y volver a subirlo, deja marcadas SKU, Nombre y Código del proveedor — son las que el sistema usa para identificar cada producto.')}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {COLUMN_OPTIONS.map((c) => (
            <label key={c.key}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                columns[c.key] ? 'border-blue-500 bg-blue-50 text-gray-900' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}>
              <input type="checkbox" checked={columns[c.key]} onChange={() => toggleColumn(c.key)} className="accent-blue-600" />
              {t(c.label)}
            </label>
          ))}
        </div>

        {!reimportable && (
          <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-100">
            <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />
            <span>
              {t('Para que este archivo se pueda volver a importar, incluye')}{' '}
              <span className="font-semibold">{t('SKU y Nombre')}</span>, {t('o la columna')}{' '}
              <span className="font-semibold">{t('"Nombre + código (SKU) juntos"')}</span>. {t('Si no, el sistema no podrá identificar cada producto al subirlo de nuevo.')}
            </span>
          </p>
        )}
      </div>

      {/* Formato */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900">{t('Formato')}</h3>
        <div className="mt-3 flex gap-2">
          {[
            { value: 'XLSX', label: 'Excel (.xlsx)', desc: 'Mejor para abrir en la computadora' },
            { value: 'CSV',  label: 'CSV (.csv)',    desc: 'Mejor para usar en otros programas' },
          ].map((opt) => (
            <label key={opt.value}
              className={`flex flex-1 cursor-pointer items-start gap-2 rounded-lg border px-3 py-2.5 transition-colors ${
                format === opt.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
              }`}>
              <input type="radio" name="format" value={opt.value}
                checked={format === opt.value} onChange={(e) => setFormat(e.target.value)}
                className="mt-0.5 accent-blue-600" />
              <div>
                <p className="text-sm font-semibold text-gray-900">{opt.label}</p>
                <p className="text-xs text-gray-500">{t(opt.desc)}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleGenerate}
          disabled={starting || selectedKeys.length === 0 || !reimportable}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50">
          {starting ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
          {starting ? t('Generando...') : t('Generar export')}
        </button>
      </div>
    </div>
  )
}

// ── Step 2 — Download ─────────────────────────────────────────────────────────

function DownloadStep({ jobId, onRestart }) {
  const t = useT()
  const navigate = useNavigate()
  const [status, setStatus] = useState(null)
  const [downloading, setDownloading] = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await exportsApi.getStatus(jobId)
        setStatus(res.data.data)
        if (res.data.data.status === 'COMPLETED' || res.data.data.status === 'FAILED') {
          if (intervalRef.current) clearInterval(intervalRef.current)
        }
      } catch {
        // reintentamos en el próximo tick
      }
    }
    poll()
    intervalRef.current = setInterval(poll, 1500)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [jobId])

  const isDone = status?.status === 'COMPLETED'
  const isFailed = status?.status === 'FAILED'
  const total = status?.totalProducts ?? 0
  const processed = status?.processedRows ?? 0
  const pct = isDone
    ? 100
    : total > 0
      ? Math.min(99, Math.round((processed / total) * 100))
      : (status ? 8 : 0) // PENDING / total aún desconocido

  const handleDownload = async () => {
    try {
      setDownloading(true)
      const res = await exportsApi.download(jobId)
      const blob = new Blob([res.data])
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = status?.fileName || `productos.${status?.format === 'CSV' ? 'csv' : 'xlsx'}`
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
        {!isFailed && (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">
                {isDone ? t('¡Tu archivo está listo!') : t('Generando tu archivo...')}
              </h3>
              {!isDone
                ? <Loader2 size={16} className="animate-spin text-blue-600" />
                : <CheckCircle2 size={18} className="text-emerald-600" />}
            </div>

            <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full transition-all duration-300 ${isDone ? 'bg-emerald-500' : 'bg-blue-600'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {isDone
                ? <>{t('Se exportaron')} <span className="font-semibold text-gray-700">{total}</span> {t('producto(s) en formato {fmt}.', { fmt: status.format === 'CSV' ? 'CSV' : 'Excel' })}</>
                : <>{processed} / {total || '...'} {t('filas')} · {pct}%</>}
            </p>

            {isDone && (
              <div className="mt-5 flex justify-center">
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50">
                  {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  {t('Descargar archivo')}
                </button>
              </div>
            )}
          </>
        )}

        {isFailed && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            <p className="font-semibold">{t('No se pudo generar el archivo.')}</p>
            <p className="mt-1 text-xs">{status?.error ?? t('Error desconocido.')}</p>
          </div>
        )}
      </div>

      {/* Vista previa de lo que se generó */}
      {isDone && status?.previewHeaders?.length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="px-1 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            {t('Vista previa')} {total > status.previewRows.length && <>({t('primeras {n} de {total} filas', { n: status.previewRows.length, total })})</>}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60 text-xs uppercase tracking-wide text-gray-400">
                  {status.previewHeaders.map((h, i) => (
                    <th key={i} className="whitespace-nowrap px-3 py-2 text-left font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {status.previewRows.map((row, ri) => (
                  <tr key={ri} className="border-b border-gray-50">
                    {row.map((cell, ci) => (
                      <td key={ci} className="max-w-[220px] truncate whitespace-nowrap px-3 py-2 text-gray-700">{cell || '—'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(isDone || isFailed) && (
        <div className="flex flex-wrap justify-end gap-2">
          <button onClick={onRestart}
            className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
            <RotateCcw size={14} />
            {t('Generar otro export')}
          </button>
          <button onClick={() => navigate('/products')}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            {t('Volver a productos')}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Help content per step ─────────────────────────────────────────────────────

function HelpSection({ title, children }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3">
      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-gray-500">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function ConfigureHelp() {
  const t = useT()
  return (
    <>
      <p>
        {t('Exportar te permite bajar tu inventario a un archivo Excel o CSV: para tener un respaldo, compartirlo, o editarlo y volver a subirlo en lote.')}
      </p>
      <HelpSection title={t('Filtros')}>
        <p>
          {t('Eliges qué productos entran al archivo: por proveedor, por categoría, por estado (activos/inactivos) y por stock (con stock, sin stock, o bajo el mínimo). Si no tocas nada, se exportan los productos activos.')}
        </p>
      </HelpSection>
      <HelpSection title={t('Columnas')}>
        <p>
          {t('Marcas qué datos quieres incluir. Si solo necesitas una lista para imprimir, con Nombre y precio alcanza. Si vas a editar y volver a subir, conviene incluir SKU, Nombre y Código del proveedor: son las que el sistema usa para reconocer cada producto al re-importar.')}
        </p>
        <p>
          {t('La columna "Nombre + código (SKU) juntos" combina el nombre y el código interno en una sola celda — útil para listados rápidos o etiquetas.')}
        </p>
        <p>
          {t('También puedes incluir Presentación, Stock mínimo, Precio variable y las Notas de importación (las observaciones que dejó el último import) para revisarlas en Excel.')}
        </p>
      </HelpSection>
      <HelpSection title={t('Formato')}>
        <p>
          {t('Excel (.xlsx): ideal para abrir y editar en la computadora. CSV: más simple, ideal para pasarlo a otros programas o sistemas.')}
        </p>
      </HelpSection>
    </>
  )
}

function DownloadHelp() {
  const t = useT()
  return (
    <>
      <p>
        {t('Tu archivo está listo. Antes de descargarlo te mostramos una vista previa con las primeras filas, para que confirmes que salió lo que esperabas.')}
      </p>
      <HelpSection title={t('Editar y volver a subir')}>
        <p>
          {t('Si modificas el archivo y quieres volver a cargarlo, usa la función de Importar. El sistema reconoce los nombres de las columnas automáticamente, así que no necesitas cambiar los encabezados: bajas, editas y subes. Cada import queda en el "Historial" con su resultado y su reporte.')}
        </p>
      </HelpSection>
      <HelpSection title={t('Si exportaste la columna combinada')}>
        <p>
          {t('Cuando vuelvas a importar un archivo con la columna "Nombre + código (SKU)", asígnala a Nombre y activa, en Opciones avanzadas del import, "El nombre trae el código pegado al final": el sistema separa el nombre y el SKU automáticamente.')}
        </p>
      </HelpSection>
    </>
  )
}

const selectCls = 'rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 bg-white'

// ── Page ────────────────────────────────────────────────────────────────────

export default function ProductExportPage() {
  const navigate = useNavigate()
  const t = useT()
  const [step, setStep] = useState(0)
  const [jobId, setJobId] = useState(null)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/products')}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">{t('Volver')}</span>
          </button>
          <h2 className="text-2xl font-bold text-gray-900">{t('Exportar productos')}</h2>
        </div>
        <HelpDrawer title={step === 0 ? t('Configurar el export') : t('Descargar el archivo')} buttonLabel={t('¿Cómo funciona?')}>
          {step === 0 ? <ConfigureHelp /> : <DownloadHelp />}
        </HelpDrawer>
      </div>

      <Stepper current={step} />

      {step === 0 && (
        <ConfigureStep onStarted={(id) => { setJobId(id); setStep(1) }} />
      )}

      {step === 1 && jobId && (
        <DownloadStep
          jobId={jobId}
          onRestart={() => { setJobId(null); setStep(0) }}
        />
      )}
    </div>
  )
}
