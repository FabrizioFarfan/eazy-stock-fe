import { useEffect, useState } from 'react'
import { X, Loader2, History, Download, FileSpreadsheet } from 'lucide-react'
import { toast } from 'sonner'
import { importsApi } from '../../services/endpoints/imports'
import { getErrorMessage } from '../../utils/handleApiError'

const STATUS_BADGE = {
  COMPLETED: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  FAILED:    'bg-red-50 text-red-700 ring-red-100',
  IMPORTING: 'bg-blue-50 text-blue-700 ring-blue-100',
  UPLOADED:  'bg-gray-100 text-gray-600 ring-gray-200',
  MAPPING:   'bg-gray-100 text-gray-600 ring-gray-200',
}

const STATUS_LABEL = {
  COMPLETED: 'Completado',
  FAILED:    'Falló',
  IMPORTING: 'Importando',
  UPLOADED:  'Sin terminar',
  MAPPING:   'Sin terminar',
}

const STRATEGY_LABEL = {
  SKIP:    'Saltar duplicados',
  REPLACE: 'Reemplazar stock',
  UPDATE:  'Actualizar datos',
}

function formatDateTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
}

/** Desglose creados/actualizados/saltados desde el resultSummary (JSON) del job. */
function parseSummary(job) {
  if (!job.resultSummary) return null
  try { return JSON.parse(job.resultSummary) } catch { return null }
}

function HistoryRow({ job }) {
  const [downloading, setDownloading] = useState(false)
  const summary = parseSummary(job)

  const downloadReport = async () => {
    setDownloading(true)
    try {
      const res = await importsApi.downloadReport(job.jobId)
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `import-${job.fileName.replace(/\.(xlsx|csv)$/i, '')}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50">
            <FileSpreadsheet size={16} className="text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">{job.fileName}</p>
            <p className="text-xs text-gray-500">
              {formatDateTime(job.createdAt)}
              {job.userName ? <> · {job.userName}</> : null}
              {job.duplicateStrategy ? <> · {STRATEGY_LABEL[job.duplicateStrategy] ?? job.duplicateStrategy}</> : null}
            </p>
          </div>
        </div>
        <span className={`flex-shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${
          STATUS_BADGE[job.status] ?? STATUS_BADGE.UPLOADED}`}>
          {STATUS_LABEL[job.status] ?? job.status}
        </span>
      </div>

      {(job.status === 'COMPLETED' || job.status === 'FAILED') && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
          <span>{job.totalRows} fila{job.totalRows !== 1 ? 's' : ''}</span>
          {summary ? (
            <>
              <span className="text-emerald-700 font-medium">{summary.productsCreated} creados</span>
              <span className="text-blue-700 font-medium">{summary.productsUpdated} actualizados</span>
              {summary.productsSkipped > 0 && <span>{summary.productsSkipped} saltados</span>}
            </>
          ) : (
            <span className="text-emerald-700 font-medium">{job.successCount} con éxito</span>
          )}
          {job.errorCount > 0 && <span className="text-red-600 font-medium">{job.errorCount} con error</span>}
          {job.warningCount > 0 && <span className="text-amber-700">{job.warningCount} con observación</span>}
          <button
            type="button"
            onClick={downloadReport}
            disabled={downloading}
            className="ml-auto flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {downloading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
            Reporte
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * Historial de imports del negocio (últimos 50). Se abre desde el botón
 * "Historial" en la página de import — puro read-only, por comodidad para
 * saber qué archivos se subieron, cuándo y con qué resultado.
 */
export default function ImportHistoryModal({ onClose }) {
  const [jobs, setJobs] = useState(null)

  useEffect(() => {
    let alive = true
    importsApi.history()
      .then((res) => { if (alive) setJobs(res.data.data ?? []) })
      .catch((err) => {
        toast.error(getErrorMessage(err))
        if (alive) setJobs([])
      })
    return () => { alive = false }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="flex w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl" style={{ maxHeight: '85vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <History size={18} className="text-blue-600" />
            <h3 className="text-base font-bold text-gray-900">Historial de imports</h3>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50/60 px-6 py-5">
          {jobs === null ? (
            <div className="flex items-center justify-center py-10 text-gray-400">
              <Loader2 size={20} className="animate-spin" />
            </div>
          ) : jobs.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-500">
              Todavía no hay imports en este negocio.
            </p>
          ) : (
            jobs.map((job) => <HistoryRow key={job.jobId} job={job} />)
          )}
        </div>
      </div>
    </div>
  )
}
