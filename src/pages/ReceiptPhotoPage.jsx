import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle, ArrowLeft, ArrowRight, Camera, CheckCircle2, ImagePlus, Loader2, PackagePlus, Search, Sparkles, X,
} from 'lucide-react'
import { toast } from 'sonner'
import { photoLoadsApi } from '../services/endpoints/photoLoads'
import { productsApi } from '../services/endpoints/products'
import { useAuth } from '../context/AuthContext'
import { useSuppliers, useCreateSupplier } from '../hooks/useSuppliers'
import { PRODUCTS_KEY, useProductSearch } from '../hooks/useProducts'
import { useDebounce } from '../hooks/useDebounce'
import EntityPicker from '../components/ui/EntityPicker'
import SupplierReceiptModal from '../components/stock/SupplierReceiptModal'
import { getErrorCode, getErrorMessage } from '../utils/handleApiError'
import { shrinkImage } from '../utils/productImage'
import { currencySymbol, formatPrice } from '../utils/formatMoney'
import { MAX_PHOTO_BYTES, PHOTO_UNITS } from '../utils/photoLoad'
import { buildReceiptDraft, newProductBody, receiptSummary, toReceiptRows } from '../utils/receiptPhoto'
import { useT } from '../i18n'

/**
 * «Recibir mercadería con fotos» (Frank, 22-nov-2026): llegó mercadería y, en vez de teclear la factura, se le saca
 * una foto (factura, guía, nota de pedido o la hoja del cuaderno escrita a mano).
 *
 *   photos  → hasta 6 fotos del documento, reducidas aquí antes de subir
 *   reading → la IA copia las líneas (el servidor responde enseguida; aquí se pregunta cada 3 s)
 *   review  → por línea: «es este producto», «es nuevo» o «saltar», con su cantidad y su costo
 *   receipt → se abre «Nueva recepción» ya llena: ahí se revisa el pago y se guarda como cualquier compra
 *
 * Nada toca el stock hasta guardar la recepción. La lectura queda en el servidor: si se cierra la pantalla, se retoma.
 */

const PROBLEM_TEXT = {
  PICK: 'Dinos cuál es',
  NAME: 'Ponle un nombre',
  QTY: 'Falta la cantidad',
  COST: 'Revisa el costo',
  DUPLICATE: 'Está repetido en esta lista',
}

async function prepare(file) {
  for (const [maxPx, quality] of [[1700, 0.85], [1500, 0.75], [1300, 0.65], [1100, 0.55]]) {
    const out = await shrinkImage(file, { maxPx, quality })
    if (out.size <= MAX_PHOTO_BYTES) return out
  }
  throw new Error('La foto pesa demasiado')
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** Buscar un producto del catálogo para una línea que la lectura no reconoció (o reconoció mal). */
function ProductFinder({ onPick, onCancel }) {
  const t = useT()
  const [query, setQuery] = useState('')
  const debounced = useDebounce(query, 300)
  const { items, isLoading } = useProductSearch(debounced)
  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-2" data-testid="receipt-photo-finder">
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2.5">
        <Search size={14} className="flex-shrink-0 text-gray-400" />
        <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('Buscar en mis productos...')}
          className="w-full min-w-0 bg-transparent py-2 text-sm outline-none" />
        <button type="button" onClick={onCancel} aria-label={t('Cerrar')} className="rounded p-1 text-gray-400 hover:bg-gray-100"><X size={14} /></button>
      </div>
      {debounced && (
        <ul className="mt-1.5 max-h-52 overflow-y-auto">
          {isLoading && <li className="px-2 py-2 text-xs text-gray-400">{t('Buscando...')}</li>}
          {!isLoading && items.length === 0 && <li className="px-2 py-2 text-xs text-gray-400">{t('No hay productos con ese nombre.')}</li>}
          {items.slice(0, 12).map((p) => (
            <li key={p.id}>
              <button type="button" onClick={() => onPick(p)}
                className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-white">
                <span className="min-w-0 truncate font-medium text-gray-900">{p.name}</span>
                <span className="flex-shrink-0 font-mono text-[11px] text-gray-400">{p.sku}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function ReceiptPhotoPage() {
  const t = useT()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { user } = useAuth()
  // La recepción completa (con costos y pago) es del dueño; el vendedor tiene su «Anotar lo que llegó».
  const allowed = user?.role === 'OWNER'

  const [stage, setStage] = useState('loading')
  const [status, setStatus] = useState(null)
  const [photos, setPhotos] = useState([]) // [{ id, file, url }]
  const [progress, setProgress] = useState(null)
  const [error, setError] = useState(null) // { message, limit, notCounted }
  const [loadId, setLoadId] = useState(null)
  const [read, setRead] = useState(null) // lo que decía el documento: { supplierName, referenceDocument, total }
  const [rows, setRows] = useState([])
  const [supplierId, setSupplierId] = useState(null)
  const [reference, setReference] = useState('')
  const [finding, setFinding] = useState(null) // key de la línea con el buscador abierto
  const [saving, setSaving] = useState(false)
  const alive = useRef(true)
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])

  const { data: suppliersData } = useSuppliers({ size: 200 }, { enabled: allowed })
  const createSupplier = useCreateSupplier()
  const suppliers = useMemo(() => suppliersData?.content ?? [], [suppliersData])
  const draftKey = `eazystock_receipt_draft_${user?.businessId ?? 'global'}`

  const openReview = useCallback((load) => {
    const receipt = load.receipt ?? { lines: [] }
    setLoadId(load.id)
    setRead({ supplierName: receipt.supplierName ?? null, referenceDocument: receipt.referenceDocument ?? null, total: receipt.total ?? null })
    setRows(toReceiptRows(receipt.lines ?? []))
    setSupplierId(receipt.supplier?.id ?? null)
    setReference(receipt.referenceDocument ?? '')
    setStage('review')
  }, [])

  const follow = useCallback(async (id) => {
    setLoadId(id)
    setStage('reading')
    for (let i = 0; i < 200 && alive.current; i += 1) {
      await wait(3000)
      let load
      try {
        load = (await photoLoadsApi.get(id)).data.data
      } catch {
        continue // un corte de red no cancela la lectura
      }
      if (!alive.current) return
      if (load.status === 'ANALYZED') { openReview(load); return }
      if (load.status === 'FAILED') {
        setError({ message: load.errorMessage || t('No pudimos leer las fotos. Inténtalo otra vez.'), notCounted: true })
        setStage('photos')
        return
      }
    }
  }, [openReview, t])

  useEffect(() => {
    if (!allowed) { navigate('/stock', { replace: true }); return }
    let cancelled = false
    photoLoadsApi.status('RECEIPT').then((r) => {
      if (cancelled) return
      const s = r.data.data
      setStatus(s)
      if (s.pending?.status === 'ANALYZED') openReview(s.pending)
      else if (s.pending?.status === 'ANALYZING') follow(s.pending.id)
      else setStage('photos')
    }).catch((e) => {
      if (cancelled) return
      setError({ message: getErrorMessage(e) })
      setStage('photos')
    })
    return () => { cancelled = true }
    // sólo al entrar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Fotos ──────────────────────────────────────────────────────────────────
  const maxPhotos = status?.maxPhotos ?? 6
  const remaining = status?.remaining ?? 0
  const canRead = status?.enabled === true && remaining > 0
  const addFiles = (fileList) => {
    const files = Array.from(fileList ?? []).filter((f) => f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name))
    if (files.length === 0) return
    setError(null)
    setPhotos((prev) => {
      const room = maxPhotos - prev.length
      if (files.length > room) toast.message(t('Máximo {n} fotos por documento.', { n: maxPhotos }))
      return [...prev, ...files.slice(0, Math.max(0, room)).map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, file, url: URL.createObjectURL(file),
      }))]
    })
  }
  const removePhoto = (id) => setPhotos((prev) => {
    const gone = prev.find((p) => p.id === id)
    if (gone) URL.revokeObjectURL(gone.url)
    return prev.filter((p) => p.id !== id)
  })

  const send = async () => {
    if (photos.length === 0 || progress) return
    setError(null)
    setProgress({ sent: 0, total: photos.length })
    let id = null
    try {
      id = (await photoLoadsApi.create('RECEIPT')).data.data.id
      for (let i = 0; i < photos.length; i += 1) {
        const small = await prepare(photos[i].file)
        await photoLoadsApi.addPhoto(id, small)
        if (!alive.current) return
        setProgress({ sent: i + 1, total: photos.length })
      }
      await photoLoadsApi.analyze(id)
      qc.invalidateQueries({ queryKey: ['photo-load-status'] })
      setProgress(null)
      follow(id)
    } catch (e) {
      if (id) photoLoadsApi.discard(id).catch(() => {})
      setProgress(null)
      setError({
        message: e?.response ? getErrorMessage(e) : t('No se pudieron subir las fotos. Revisa tu conexión e inténtalo otra vez.'),
        limit: getErrorCode(e) === 'PHOTO_LOAD_LIMIT',
      })
    }
  }

  // ── Revisión ───────────────────────────────────────────────────────────────
  const summary = useMemo(() => receiptSummary(rows), [rows])
  const patch = (key, changes) => setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...changes } : r)))
  const pickProduct = (key, product) => {
    setRows((prev) => prev.map((r) => (r.key === key ? {
      ...r, mode: 'match', product, failure: null,
      candidates: r.candidates.some((c) => c.id === product.id) ? r.candidates : [product, ...r.candidates],
    } : r)))
    setFinding(null)
  }
  const supplier = suppliers.find((s) => s.id === supplierId) ?? null
  const differs = read?.total != null && Math.abs(Number(read.total) - summary.total) >= 0.01

  const handleCreateSupplier = async (name, extra) => {
    const created = await createSupplier.mutateAsync({
      name, contact: extra?.contact || undefined, phone: extra?.phone || undefined,
    })
    setSupplierId(created.id)
  }
  const createReadSupplier = async () => {
    try { await handleCreateSupplier(read.supplierName, {}) } catch (e) { toast.error(getErrorMessage(e)) }
  }

  /** Crea los productos nuevos, cierra la lectura y abre «Nueva recepción» ya llena. */
  const goToReceipt = async () => {
    if (!supplier) { toast.error(t('Elige el proveedor de esta compra.')); return }
    if (!summary.ok || saving) return
    try {
      const old = JSON.parse(localStorage.getItem(draftKey))
      if (old?.items?.length && !window.confirm(t('Tienes una recepción a medias guardada. ¿La reemplazamos por esta?'))) return
    } catch { /* sin borrador */ }
    setSaving(true)
    const created = new Map()
    let failed = 0
    for (const r of rows) {
      if (r.mode !== 'new') continue
      try {
        created.set(r.key, (await productsApi.create(newProductBody(r, supplier.id))).data.data)
      } catch (e) {
        failed += 1
        const reason = getErrorCode(e) === 'DUPLICATE_PRODUCT_NAME'
          ? t('Ya tienes un producto con ese nombre: búscalo en tus productos.')
          : getErrorMessage(e)
        setRows((prev) => prev.map((x) => (x.key === r.key ? { ...x, failure: reason } : x)))
      }
    }
    // Lo que sí se creó ya es un producto del catálogo: la línea pasa a «es este» aunque otra haya fallado.
    if (created.size > 0) {
      qc.invalidateQueries({ queryKey: [PRODUCTS_KEY] })
      setRows((prev) => prev.map((x) => (created.has(x.key) ? { ...x, mode: 'match', product: created.get(x.key), failure: null } : x)))
    }
    if (failed > 0) {
      setSaving(false)
      toast.error(failed === 1 ? t('1 producto no se pudo crear. Revísalo y vuelve a intentarlo.') : t('{n} productos no se pudieron crear. Revísalos y vuelve a intentarlo.', { n: failed }))
      return
    }
    const draft = buildReceiptDraft({
      supplier,
      rows,
      productOf: (r) => (r.mode === 'new' ? created.get(r.key) : r.product),
      referenceDocument: reference,
      documentTotal: read?.total,
    })
    try {
      localStorage.setItem(draftKey, JSON.stringify(draft))
    } catch {
      setSaving(false)
      toast.error(t('No se pudo preparar la recepción (almacenamiento del navegador bloqueado).'))
      return
    }
    photoLoadsApi.done(loadId, { productsCreated: created.size }).catch(() => {})
    qc.invalidateQueries({ queryKey: ['photo-load-status'] })
    setSaving(false)
    setStage('receipt')
  }

  const discard = async () => {
    if (!window.confirm(t('¿Descartar esta lectura? Las fotos ya se leyeron: no se recupera.'))) return
    try { await photoLoadsApi.discard(loadId) } catch { /* ya no está */ }
    qc.invalidateQueries({ queryKey: ['photo-load-status'] })
    navigate('/stock')
  }

  const symbol = currencySymbol()
  const photoUrl = (n) => photos[n - 1]?.url ?? null

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/stock')}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
          <ArrowLeft size={14} />
          <span className="hidden sm:inline">{t('Volver')}</span>
        </button>
        <div className="min-w-0">
          <h2 className="text-xl font-bold leading-tight text-gray-900 sm:text-2xl">{t('Recibir mercadería con fotos')}</h2>
          <p className="flex items-center gap-1 text-xs font-medium text-blue-600"><Sparkles size={12} />{t('Con inteligencia artificial')}</p>
        </div>
      </div>

      {stage === 'loading' && (
        <div className="flex items-center justify-center py-24 text-gray-400"><Loader2 className="animate-spin" size={28} /></div>
      )}

      {/* ── 1. Las fotos del documento ── */}
      {stage === 'photos' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-4">
            {error && (error.limit ? <LimitBox t={t} status={status} message={error.message} /> : (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
                <p className="font-semibold">{error.message}</p>
                {error.notCounted && <p className="mt-0.5 text-xs">{t('Esta lectura no se descontó: puedes intentarlo otra vez.')}</p>}
              </div>
            ))}
            {status && !status.enabled && (
              <p className="rounded-xl bg-gray-100 px-4 py-3 text-sm text-gray-600">{t('La lectura de fotos no está disponible en este momento. Puedes registrar la recepción a mano.')}</p>
            )}
            {status?.enabled && remaining === 0 && !error?.limit && <LimitBox t={t} status={status} />}

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-bold text-gray-900">{t('Fotos del documento')} <span className="font-medium text-gray-400">{photos.length} / {maxPhotos}</span></p>
                <div className="flex flex-wrap gap-2">
                  <label className={`flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 ${photos.length >= maxPhotos || progress || !canRead ? 'pointer-events-none opacity-40' : ''}`}>
                    <Camera size={16} />{t('Tomar foto')}
                    <input type="file" accept="image/*" capture="environment" className="hidden" data-testid="receipt-photo-camera"
                      onChange={(e) => { addFiles(e.target.files); e.target.value = '' }} />
                  </label>
                  <label className={`flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 ${photos.length >= maxPhotos || progress || !canRead ? 'pointer-events-none opacity-40' : ''}`}>
                    <ImagePlus size={16} />{t('Elegir fotos')}
                    <input type="file" accept="image/*" multiple className="hidden" data-testid="receipt-photo-files"
                      onChange={(e) => { addFiles(e.target.files); e.target.value = '' }} />
                  </label>
                </div>
              </div>
              {photos.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-gray-200 px-6 py-14 text-center text-sm text-gray-400">
                  {t('Sácale una foto a la factura, la guía o la hoja donde apuntaste lo que llegó.')}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {photos.map((p, i) => (
                    <div key={p.id} className="relative overflow-hidden rounded-xl bg-gray-100 ring-1 ring-gray-200">
                      <img src={p.url} alt={t('Foto {n}', { n: i + 1 })} className="aspect-[3/4] w-full object-cover" />
                      <span className="absolute left-1.5 top-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[11px] font-bold text-white">{i + 1}</span>
                      {!progress && (
                        <button onClick={() => removePhoto(p.id)} aria-label={t('Quitar foto')}
                          className="absolute right-1.5 top-1.5 rounded-full bg-white/90 p-1 text-gray-700 shadow hover:bg-white"><X size={14} /></button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button onClick={send} disabled={photos.length === 0 || !!progress || !canRead} data-testid="receipt-photo-read"
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-blue-600/30 hover:bg-blue-700 disabled:opacity-40">
                {progress ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {progress ? t('Subiendo foto {a} de {b}…', { a: Math.min(progress.sent + 1, progress.total), b: progress.total })
                  : t('Leer el documento')}
              </button>
              {canRead && !progress && (
                <span className="text-sm text-gray-500">
                  {status.limitScope === 'MONTHLY'
                    ? (remaining === 1 ? t('Te queda 1 lectura este mes.') : t('Te quedan {n} lecturas este mes.', { n: remaining }))
                    : (remaining === 1 ? t('Te queda 1 lectura hoy.') : t('Te quedan {n} lecturas hoy.', { n: remaining }))}
                </span>
              )}
            </div>
          </div>

          <aside className="flex flex-col gap-3 lg:pt-1">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-sm font-bold text-gray-900">{t('Cómo funciona')}</p>
              <ol className="mt-3 space-y-3 text-sm text-gray-600">
                {[
                  'Le sacas una foto al documento de la compra: factura, guía, nota de pedido o tu cuaderno.',
                  'La IA copia cada línea y reconoce los productos que ya tienes.',
                  'Tú revisas: lo que no reconoció lo buscas o lo creas ahí mismo.',
                  'Se abre la recepción ya llena. Nada entra al stock hasta que la guardas.',
                ].map((step, i) => (
                  <li key={step} className="flex gap-3">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">{i + 1}</span>
                    <span>{t(step)}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="flex items-center gap-2 font-bold"><AlertTriangle size={15} />{t('Para que lea bien')}</p>
              <ul className="mt-2 space-y-1">
                {['La hoja entera, de frente y con buena luz', 'Sin dedos ni sombras encima de los números', 'Si tiene varias hojas, una foto por hoja y en orden', 'A mano también vale, con letra clara'].map((tip) => (
                  <li key={tip} className="flex items-start gap-2"><CheckCircle2 size={14} className="mt-0.5 flex-shrink-0 text-amber-600" />{t(tip)}</li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      )}

      {/* ── 2. Leyendo ── */}
      {stage === 'reading' && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-gray-100 bg-white px-6 py-20 text-center shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><Loader2 size={30} className="animate-spin" /></div>
          <p className="text-lg font-bold text-gray-900">{t('Leyendo el documento…')}</p>
          <p className="max-w-md text-sm text-gray-500">{t('Suele tardar menos de un minuto. Puedes dejar esta pantalla abierta o volver luego: la lectura te espera aquí.')}</p>
        </div>
      )}

      {/* ── 3. Revisión ── */}
      {stage === 'review' && (
        <div className="flex flex-col gap-4 pb-24">
          {rows.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white px-6 py-16 text-center shadow-sm">
              <p className="text-lg font-bold text-gray-900">{t('No encontramos productos en esas fotos')}</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">{t('Prueba con una foto más cerca, de frente y con buena luz, donde se lean las líneas del documento.')}</p>
              <button onClick={discard} className="mt-5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50">{t('Volver a Stock')}</button>
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm text-blue-900">
                <p className="font-bold">{t('Revisa lo que leímos antes de pasar a la recepción')}</p>
                <p className="mt-0.5">{t('Comprueba que cada línea sea el producto correcto, y su cantidad y su costo. Todavía no entra nada al stock: eso pasa al guardar la recepción.')}</p>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <EntityPicker
                    label={<>{t('Proveedor de esta compra')} <span className="text-red-500">*</span></>}
                    items={suppliers}
                    value={supplierId}
                    onChange={setSupplierId}
                    onCreate={handleCreateSupplier}
                    extraFields={[
                      { name: 'contact', placeholder: t('Contacto (opcional)') },
                      { name: 'phone', placeholder: t('Teléfono (opcional)') },
                    ]}
                    placeholder={t('Buscar proveedor...')}
                    createLabel={t('Nuevo proveedor')}
                    isCreating={createSupplier.isPending}
                  />
                  {read?.supplierName && !supplierId && (
                    <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600" data-testid="receipt-photo-read-supplier">
                      <span>{t('En el documento dice')}: <span className="font-semibold text-gray-900">{read.supplierName}</span></span>
                      <button type="button" onClick={createReadSupplier} disabled={createSupplier.isPending}
                        className="font-bold text-blue-600 hover:underline disabled:opacity-50">{t('Crearlo como proveedor nuevo')}</button>
                    </p>
                  )}
                </div>
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <label className="block text-sm font-medium text-gray-700">{t('Referencia (factura / guía)')}
                    <input value={reference} onChange={(e) => setReference(e.target.value)} maxLength={60} placeholder={t('Factura 0023-001234')}
                      className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-400" />
                  </label>
                  <p className="mt-3 text-sm text-gray-600">
                    {t('Suma de las líneas')}: <span className="font-bold text-gray-900" data-testid="receipt-photo-sum">{formatPrice(summary.total)}</span>
                  </p>
                  {differs && (
                    <p className="mt-1 text-xs text-amber-700" data-testid="receipt-photo-total-differs">
                      {t('El documento dice {total}. Suele ser por impuestos o flete: en la recepción queda el total del documento y puedes cambiarlo.', { total: formatPrice(read.total) })}
                    </p>
                  )}
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
                  <p className="text-sm font-bold text-gray-700">{rows.length === 1 ? t('1 línea leída') : t('{n} líneas leídas', { n: rows.length })}</p>
                  {summary.toCreate > 0 && (
                    <span className="text-xs font-semibold text-emerald-700">{summary.toCreate === 1 ? t('1 producto nuevo') : t('{n} productos nuevos', { n: summary.toCreate })}</span>
                  )}
                </div>
                <div className="hidden grid-cols-[minmax(0,1.1fr)_minmax(0,1.6fr)_110px_130px_110px] gap-3 border-b border-gray-100 bg-gray-50 px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-gray-400 lg:grid">
                  <span>{t('En el documento')}</span><span>{t('Tu producto')}</span><span>{t('Cantidad')}</span><span>{t('Costo unit.')}</span><span className="text-right">{t('Subtotal')}</span>
                </div>
                <ul className="divide-y divide-gray-100">
                  {rows.map((r) => {
                    const problem = summary.problems[r.key]
                    const skipped = r.mode === 'skip'
                    const url = photoUrl(r.photo)
                    const qty = Number(String(r.qty).replace(',', '.'))
                    const cost = Number(String(r.cost).replace(',', '.'))
                    return (
                      <li key={r.key} className={`px-4 py-3 ${skipped ? 'bg-gray-50/70' : ''}`} data-testid="receipt-photo-row" data-mode={r.mode}>
                        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.6fr)_110px_130px_110px] lg:items-start">
                          {/* lo que decía el documento */}
                          <div className="flex min-w-0 items-start gap-2.5">
                            {url && <img src={url} alt="" className="hidden h-10 w-8 flex-shrink-0 rounded object-cover ring-1 ring-gray-200 sm:block" />}
                            <div className="min-w-0">
                              <p className={`break-words text-sm ${skipped ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{r.readName}</p>
                              <p className="mt-0.5 flex flex-wrap gap-x-2 text-[11px] text-gray-400">
                                {r.code && <span className="font-mono">{r.code}</span>}
                                {r.confidence === 'LOW' && !skipped && <span className="font-semibold text-amber-600">{t('No se leía claro: revísalo')}</span>}
                              </p>
                            </div>
                          </div>

                          {/* qué producto es */}
                          <div className="min-w-0">
                            {finding === r.key ? (
                              <ProductFinder onPick={(p) => pickProduct(r.key, p)} onCancel={() => setFinding(null)} />
                            ) : r.mode === 'match' ? (
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                <p className="min-w-0 break-words text-sm font-semibold text-gray-900" data-testid="receipt-photo-product">
                                  <CheckCircle2 size={14} className="mr-1 inline text-emerald-600" />{r.product.name}
                                </p>
                                <button type="button" onClick={() => patch(r.key, { mode: 'pick' })} className="text-xs font-bold text-blue-600 hover:underline">{t('Cambiar')}</button>
                              </div>
                            ) : r.mode === 'pick' ? (
                              <div className="flex flex-col gap-1.5" data-testid="receipt-photo-pick">
                                <p className="text-xs font-semibold text-amber-700">{t('¿Cuál de tus productos es?')}</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {r.candidates.map((c) => (
                                    <button key={c.id} type="button" onClick={() => pickProduct(r.key, c)} data-testid="receipt-photo-candidate"
                                      className="max-w-full truncate rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-left text-xs font-semibold text-gray-800 hover:border-blue-400 hover:bg-blue-50">
                                      {c.name}
                                    </button>
                                  ))}
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold">
                                  <button type="button" onClick={() => setFinding(r.key)} className="text-blue-600 hover:underline">{t('Buscar otro')}</button>
                                  <button type="button" onClick={() => patch(r.key, { mode: 'new', product: null })} className="text-emerald-700 hover:underline">{t('Es un producto nuevo')}</button>
                                  <button type="button" onClick={() => patch(r.key, { mode: 'skip' })} className="text-gray-500 hover:underline">{t('Saltar esta línea')}</button>
                                </div>
                              </div>
                            ) : r.mode === 'new' ? (
                              <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="flex-shrink-0 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">{t('Nuevo')}</span>
                                  <input value={r.newName} onChange={(e) => patch(r.key, { newName: e.target.value, failure: null })} maxLength={150}
                                    aria-label={t('Nombre del producto nuevo')} data-testid="receipt-photo-new-name"
                                    className={`w-full min-w-0 rounded-lg border px-3 py-2 text-sm font-semibold text-gray-900 outline-none focus:border-blue-400 ${problem === 'NAME' || problem === 'DUPLICATE' || r.failure ? 'border-red-300' : 'border-gray-200'}`} />
                                  <select value={r.unit} onChange={(e) => patch(r.key, { unit: e.target.value })} aria-label={t('Unidad')}
                                    className="flex-shrink-0 rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm outline-none focus:border-blue-400">
                                    {PHOTO_UNITS.map((u) => <option key={u} value={u}>{t(u)}</option>)}
                                  </select>
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold">
                                  <button type="button" onClick={() => setFinding(r.key)} className="text-blue-600 hover:underline">{t('Ya lo tengo: buscarlo')}</button>
                                  <button type="button" onClick={() => patch(r.key, { mode: 'skip' })} className="text-gray-500 hover:underline">{t('Saltar esta línea')}</button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-wrap items-center gap-x-3 text-xs">
                                <span className="text-gray-400">{t('No entra en la recepción')}</span>
                                <button type="button" onClick={() => patch(r.key, { mode: r.product ? 'match' : r.candidates.length > 0 ? 'pick' : 'new' })}
                                  className="font-bold text-blue-600 hover:underline">{t('Incluirla')}</button>
                              </div>
                            )}
                            {!skipped && (problem || r.failure) && (
                              <p className="mt-1 text-xs font-semibold text-red-600" data-testid="receipt-photo-problem">{r.failure ?? t(PROBLEM_TEXT[problem])}</p>
                            )}
                          </div>

                          {/* cantidad, costo y subtotal */}
                          <div className="col-span-1 grid grid-cols-3 gap-3 lg:col-span-3 lg:grid-cols-[110px_130px_110px]">
                            <label>
                              <span className="mb-0.5 block text-[11px] font-bold uppercase tracking-wide text-gray-400 lg:hidden">{t('Cantidad')}</span>
                              <input value={r.qty} onChange={(e) => patch(r.key, { qty: e.target.value })} disabled={skipped} inputMode="decimal"
                                aria-label={t('Cantidad')} data-testid="receipt-photo-qty"
                                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-400 disabled:bg-transparent disabled:text-gray-400 ${problem === 'QTY' ? 'border-red-300' : 'border-gray-200'}`} />
                            </label>
                            <label>
                              <span className="mb-0.5 block text-[11px] font-bold uppercase tracking-wide text-gray-400 lg:hidden">{t('Costo unit.')}</span>
                              <div className={`flex items-center rounded-lg border bg-white px-2 ${problem === 'COST' ? 'border-red-300' : 'border-gray-200'}`}>
                                <span className="text-xs text-gray-400">{symbol}</span>
                                <input value={r.cost} onChange={(e) => patch(r.key, { cost: e.target.value })} disabled={skipped} inputMode="decimal"
                                  aria-label={t('Costo unit.')} data-testid="receipt-photo-cost"
                                  className="w-full min-w-0 bg-transparent px-1.5 py-2 text-sm outline-none disabled:text-gray-400" />
                              </div>
                            </label>
                            <p className="self-end py-2 text-right text-sm font-semibold text-gray-900 lg:self-start">
                              {!skipped && Number.isFinite(qty) && Number.isFinite(cost) && qty * cost > 0 ? formatPrice(qty * cost) : '—'}
                            </p>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </>
          )}

          {rows.length > 0 && (
            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 px-4 py-3 backdrop-blur lg:left-64">
              <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
                <button onClick={discard} className="rounded-xl px-3 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-100">{t('Descartar')}</button>
                <div className="flex items-center gap-3">
                  {!supplierId && <span className="hidden text-xs font-semibold text-amber-700 sm:inline">{t('Falta elegir el proveedor')}</span>}
                  {supplierId && !summary.ok && summary.lines > 0 && <span className="hidden text-xs font-semibold text-amber-700 sm:inline">{t('Hay líneas por revisar')}</span>}
                  <button onClick={goToReceipt} disabled={!summary.ok || saving} data-testid="receipt-photo-continue"
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-blue-600/30 hover:bg-blue-700 disabled:opacity-40">
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <PackagePlus size={16} />}
                    {t('Pasar a la recepción')} <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 4. La recepción, ya llena: se guarda como cualquier compra ── */}
      {stage === 'receipt' && <SupplierReceiptModal fromPhotos onClose={() => navigate('/stock')} />}
    </div>
  )
}

/** Sin lecturas: se acabaron las del mes (→ planes) o las de hoy. Siempre queda registrar la recepción a mano. */
function LimitBox({ t, status, message }) {
  const monthly = status?.limitScope === 'MONTHLY'
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <p className="font-bold">{monthly ? t('Ya usaste tus lecturas de este mes') : t('Ya hiciste tus lecturas de hoy')}</p>
      <p className="mt-0.5 text-xs">{message ?? (monthly
        ? t('Con el plan Pro tienes lecturas todos los días. Mientras tanto puedes registrar la recepción a mano.')
        : t('Mañana tienes más. Mientras tanto puedes registrar la recepción a mano.'))}</p>
      {monthly && (
        <Link to="/settings#plan" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:underline">
          {t('Ver planes y subir de plan')} →
        </Link>
      )}
    </div>
  )
}
