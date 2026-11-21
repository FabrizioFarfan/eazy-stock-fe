import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle, ArrowLeft, ArrowRight, Camera, CheckCircle2, ImagePlus, ListChecks, Loader2,
  PackageCheck, Sparkles, Trash2, X,
} from 'lucide-react'
import { toast } from 'sonner'
import { photoLoadsApi } from '../services/endpoints/photoLoads'
import { useAuth } from '../context/AuthContext'
import { useSuppliers, useCreateSupplier } from '../hooks/useSuppliers'
import { PRODUCTS_KEY } from '../hooks/useProducts'
import EntityPicker from '../components/ui/EntityPicker'
import { getErrorCode, getErrorMessage } from '../utils/handleApiError'
import { shrinkImage } from '../utils/productImage'
import { currencySymbol } from '../utils/formatMoney'
import {
  MAX_PHOTO_BYTES, PHOTO_UNITS, buildConfirmBody, keepFailed, reviewSummary, toRows,
} from '../utils/photoLoad'
import { useT } from '../i18n'

/**
 * «Carga tu inventario con fotos» (Frank, 21-nov-2026): la primera función con IA.
 *
 *   intro   → tres pasos y el aviso «hazlo bien, es una sola vez»
 *   photos  → hasta 10 fotos, reducidas aquí a ~1500 px antes de subir
 *   reading → se suben de una en una y la IA las lee (el servidor responde enseguida; aquí se pregunta cada 3 s)
 *   review  → la tabla editable: NADA se crea hasta pulsar «Crear»
 *   done    → resumen y enlace a Productos
 *
 * La propuesta queda guardada en el servidor: si se cierra la pantalla, al volver se retoma en la revisión.
 */

const PROBLEM_TEXT = {
  NAME: 'Ponle un nombre',
  PRICE: 'Para actualizarlo hace falta un precio',
  NUMBER: 'Revisa el número',
  DUPLICATE: 'Está repetido en esta lista',
}

/** A ~1500 px de lado; si aun así pesa más de lo que deja pasar el servidor, se aprieta un poco más. */
async function prepare(file) {
  for (const [maxPx, quality] of [[1500, 0.82], [1500, 0.65], [1200, 0.6], [1000, 0.5]]) {
    const out = await shrinkImage(file, { maxPx, quality })
    if (out.size <= MAX_PHOTO_BYTES) return out
  }
  throw new Error('La foto pesa demasiado')
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export default function ProductPhotoLoadPage() {
  const t = useT()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { user, can } = useAuth()
  const allowed = user?.role === 'OWNER' || can('canManageProducts')

  const [stage, setStage] = useState('loading')
  const [status, setStatus] = useState(null)
  const [photos, setPhotos] = useState([]) // [{ id, file, url }]
  const [progress, setProgress] = useState(null) // { sent, total } mientras suben
  const [error, setError] = useState(null) // { message, limit }
  const [loadId, setLoadId] = useState(null)
  const [rows, setRows] = useState([])
  const [supplierId, setSupplierId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState(null)
  const alive = useRef(true)
  // se vuelve a poner en true al montar: en desarrollo React monta, desmonta y monta otra vez
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])

  const { data: suppliersData } = useSuppliers({ size: 200 }, { enabled: allowed })
  const createSupplier = useCreateSupplier()
  const suppliers = suppliersData?.content ?? []

  const openReview = useCallback((load) => {
    setLoadId(load.id)
    setRows(toRows(load.items ?? []))
    setStage('review')
  }, [])

  /** Pregunta cada 3 s hasta que la lectura termine. */
  const follow = useCallback(async (id) => {
    setLoadId(id)
    setStage('reading')
    for (let i = 0; i < 200 && alive.current; i += 1) {
      await wait(3000)
      let load
      try {
        load = (await photoLoadsApi.get(id)).data.data
      } catch {
        continue // un corte de red no cancela la lectura: se vuelve a preguntar
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
    if (!allowed) { navigate('/products', { replace: true }); return }
    let cancelled = false
    photoLoadsApi.status().then((r) => {
      if (cancelled) return
      const s = r.data.data
      setStatus(s)
      if (s.pending?.status === 'ANALYZED') openReview(s.pending)
      else if (s.pending?.status === 'ANALYZING') follow(s.pending.id)
      else setStage('intro')
    }).catch((e) => {
      if (cancelled) return
      setError({ message: getErrorMessage(e) })
      setStage('intro')
    })
    return () => { cancelled = true }
    // sólo al entrar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Fotos ──────────────────────────────────────────────────────────────────
  const maxPhotos = status?.maxPhotos ?? 10
  const addFiles = (fileList) => {
    const files = Array.from(fileList ?? []).filter((f) => f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name))
    if (files.length === 0) return
    setError(null)
    setPhotos((prev) => {
      const room = maxPhotos - prev.length
      if (files.length > room) toast.message(t('Máximo {n} fotos por carga.', { n: maxPhotos }))
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
      id = (await photoLoadsApi.create()).data.data.id
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
      // Nada llegó a la IA: la carga no se descuenta. Se tira lo subido a medias.
      if (id) photoLoadsApi.discard(id).catch(() => {})
      setProgress(null)
      setError({
        message: e?.response ? getErrorMessage(e) : t('No se pudieron subir las fotos. Revisa tu conexión e inténtalo otra vez.'),
        limit: getErrorCode(e) === 'PHOTO_LOAD_LIMIT',
      })
    }
  }

  // ── Revisión ───────────────────────────────────────────────────────────────
  const summary = useMemo(() => reviewSummary(rows), [rows])
  const patch = (key, changes) => setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...changes } : r)))
  const allNew = rows.filter((r) => !r.existing)
  const allChecked = allNew.length > 0 && allNew.every((r) => r.checked)
  const toggleAll = () => setRows((prev) => prev.map((r) => (r.existing ? r : { ...r, checked: !allChecked })))

  const confirm = async () => {
    if (!supplierId) { toast.error(t('Elige el proveedor de estos productos.')); return }
    if (!summary.ok || saving) return
    setSaving(true)
    try {
      const res = (await photoLoadsApi.confirm(loadId, buildConfirmBody(rows, supplierId))).data.data
      qc.invalidateQueries({ queryKey: [PRODUCTS_KEY] })
      qc.invalidateQueries({ queryKey: ['photo-load-status'] })
      setResult((prev) => ({
        created: (prev?.created ?? 0) + res.created,
        updated: (prev?.updated ?? 0) + res.updated,
        failed: res.failed ?? [],
      }))
      setRows((prev) => keepFailed(prev, res.failed))
      setStage('done')
    } catch (e) {
      toast.error(getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  const discard = async () => {
    if (!window.confirm(t('¿Descartar esta propuesta? Las fotos ya se leyeron: la carga no se recupera.'))) return
    try { await photoLoadsApi.discard(loadId) } catch { /* ya no está */ }
    qc.invalidateQueries({ queryKey: ['photo-load-status'] })
    navigate('/products')
  }

  const handleCreateSupplier = async (name, extra) => {
    const created = await createSupplier.mutateAsync({
      name, contact: extra.contact || undefined, phone: extra.phone || undefined,
    })
    setSupplierId(created.id)
  }

  const remaining = status?.remaining ?? 0
  const symbol = currencySymbol()
  const photoUrl = (n) => photos[n - 1]?.url ?? null

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/products')}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
          <ArrowLeft size={14} />
          <span className="hidden sm:inline">{t('Volver')}</span>
        </button>
        <div className="min-w-0">
          <h2 className="text-xl font-bold leading-tight text-gray-900 sm:text-2xl">{t('Carga tu inventario con fotos')}</h2>
          <p className="flex items-center gap-1 text-xs font-medium text-blue-600"><Sparkles size={12} />{t('Con inteligencia artificial')}</p>
        </div>
      </div>

      {stage === 'loading' && (
        <div className="flex items-center justify-center py-24 text-gray-400"><Loader2 className="animate-spin" size={28} /></div>
      )}

      {/* ── 1. Tres pasos y el aviso ── */}
      {stage === 'intro' && (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {[
              { icon: Camera, title: 'Toma las fotos', desc: 'De tus estantes, tu almacén, tu cuaderno o la lista de tu proveedor. Hasta {n} fotos.' },
              { icon: Sparkles, title: 'La IA propone tus productos', desc: 'Lee las fotos y arma la lista con nombre, categoría y, si se ven, precio y cantidad.' },
              { icon: ListChecks, title: 'Tú revisas y confirmas', desc: 'Corriges lo que haga falta y eliges qué se crea. Nada se guarda sin tu visto bueno.' },
            ].map((s, i) => (
              <div key={s.title} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><s.icon size={19} /></div>
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-400">{t('Paso {n}', { n: i + 1 })}</span>
                </div>
                <p className="text-base font-bold text-gray-900">{t(s.title)}</p>
                <p className="mt-1 text-sm leading-relaxed text-gray-500">{t(s.desc, { n: maxPhotos })}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
            <p className="flex items-center gap-2 text-base font-bold"><AlertTriangle size={18} />{t('Hazlo bien, es una sola vez')}</p>
            <p className="mt-1 text-sm">{t('Lo que falte después lo cargas a mano. No repitas productos en varias fotos.')}</p>
            <ul className="mt-3 grid grid-cols-1 gap-1.5 text-sm sm:grid-cols-2">
              {['Con buena luz, sin sombras ni reflejos', 'De frente, no de lado', 'Que se lean las etiquetas y los precios', 'Máximo {n} fotos por carga'].map((tip) => (
                <li key={tip} className="flex items-start gap-2"><CheckCircle2 size={15} className="mt-0.5 flex-shrink-0 text-amber-600" />{t(tip, { n: maxPhotos })}</li>
              ))}
            </ul>
          </div>

          {status && !status.enabled && (
            <p className="rounded-xl bg-gray-100 px-4 py-3 text-sm text-gray-600">{t('La carga con fotos no está disponible en este momento.')}</p>
          )}
          {error && !status && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-100">{error.message}</p>}
          {status?.enabled && remaining === 0 && <LimitBox t={t} status={status} />}

          {status?.enabled && remaining > 0 && (
            <div className="flex flex-wrap items-center gap-4">
              <button onClick={() => setStage('photos')}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-blue-600/30 hover:bg-blue-700">
                {t('Empezar')} <ArrowRight size={16} />
              </button>
              <span className="text-sm text-gray-500">
                {status.limitScope === 'LIFETIME'
                  ? t('Tienes 1 carga con fotos gratis.')
                  : remaining === 1 ? t('Te queda 1 carga hoy.') : t('Te quedan {n} cargas hoy.', { n: remaining })}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── 2. Las fotos ── */}
      {stage === 'photos' && (
        <div className="flex flex-col gap-4">
          {error && (error.limit ? <LimitBox t={t} status={status} message={error.message} /> : (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
              <p className="font-semibold">{error.message}</p>
              {error.notCounted && <p className="mt-0.5 text-xs">{t('Esta carga no se descontó: puedes intentarlo otra vez.')}</p>}
            </div>
          ))}

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-bold text-gray-900">{t('Tus fotos')} <span className="font-medium text-gray-400">{photos.length} / {maxPhotos}</span></p>
              <div className="flex flex-wrap gap-2">
                <label className={`flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 ${photos.length >= maxPhotos || progress ? 'pointer-events-none opacity-40' : ''}`}>
                  <Camera size={16} />{t('Tomar foto')}
                  <input type="file" accept="image/*" capture="environment" className="hidden"
                    onChange={(e) => { addFiles(e.target.files); e.target.value = '' }} />
                </label>
                <label className={`flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 ${photos.length >= maxPhotos || progress ? 'pointer-events-none opacity-40' : ''}`}>
                  <ImagePlus size={16} />{t('Elegir fotos')}
                  <input type="file" accept="image/*" multiple className="hidden"
                    onChange={(e) => { addFiles(e.target.files); e.target.value = '' }} />
                </label>
              </div>
            </div>

            {photos.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-gray-200 px-6 py-14 text-center text-sm text-gray-400">
                {t('Todavía no hay fotos. Toma una o elígelas de tu galería.')}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                {photos.map((p, i) => (
                  <div key={p.id} className="relative overflow-hidden rounded-xl bg-gray-100 ring-1 ring-gray-200">
                    <img src={p.url} alt={t('Foto {n}', { n: i + 1 })} className="aspect-square w-full object-cover" />
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
            <button onClick={send} disabled={photos.length === 0 || !!progress}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-blue-600/30 hover:bg-blue-700 disabled:opacity-40">
              {progress ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {progress ? t('Subiendo foto {a} de {b}…', { a: Math.min(progress.sent + 1, progress.total), b: progress.total })
                : photos.length === 1 ? t('Leer mi foto') : t('Leer mis {n} fotos', { n: photos.length })}
            </button>
            {!progress && <span className="text-sm text-gray-500">{t('Al leerlas se usa tu carga. Revisa que estén todas.')}</span>}
          </div>
        </div>
      )}

      {/* ── 3. Leyendo ── */}
      {stage === 'reading' && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-gray-100 bg-white px-6 py-20 text-center shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><Loader2 size={30} className="animate-spin" /></div>
          <p className="text-lg font-bold text-gray-900">{t('Leyendo tus fotos…')}</p>
          <p className="max-w-md text-sm text-gray-500">{t('Suele tardar entre uno y tres minutos. Puedes dejar esta pantalla abierta o volver luego: tu lista te espera aquí.')}</p>
        </div>
      )}

      {/* ── 4. Revisión ── */}
      {stage === 'review' && (
        <div className="flex flex-col gap-4 pb-24">
          {rows.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white px-6 py-16 text-center shadow-sm">
              <p className="text-lg font-bold text-gray-900">{t('No encontramos productos en esas fotos')}</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">{t('Prueba con fotos más cerca, con buena luz y donde se lean las etiquetas.')}</p>
              <button onClick={discard} className="mt-5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50">{t('Volver a Productos')}</button>
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm text-blue-900">
                <p className="font-bold">{t('Revisa la lista antes de crear nada')}</p>
                <p className="mt-0.5">{t('Corrige nombres, precios y cantidades. Desmarca lo que no quieras. Sin precio, el producto queda con «Precio variable»; sin cantidad, con stock 0.')}</p>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <EntityPicker
                  label={<>{t('Proveedor de estos productos')} <span className="text-red-500">*</span></>}
                  helperText={t('Uno para todos. Después puedes cambiarlo producto por producto.')}
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
              </div>

              <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
                  <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-gray-700">
                    <input type="checkbox" className="h-4 w-4 accent-blue-600" checked={allChecked} onChange={toggleAll} />
                    {t('Marcar todos los nuevos')}
                  </label>
                  <span className="text-xs text-gray-400">{rows.length === 1 ? t('1 producto encontrado') : t('{n} productos encontrados', { n: rows.length })}</span>
                </div>
                {/* cabecera, sólo en PC */}
                <div className="hidden grid-cols-[28px_minmax(0,2.2fr)_minmax(0,1.2fr)_110px_130px_110px_56px] gap-3 border-b border-gray-100 bg-gray-50 px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-gray-400 lg:grid">
                  <span /><span>{t('Producto')}</span><span>{t('Categoría')}</span><span>{t('Unidad')}</span>
                  <span>{t('Precio de venta')}</span><span>{t('Stock inicial')}</span><span>{t('Foto')}</span>
                </div>
                <ul className="divide-y divide-gray-100">
                  {rows.map((r) => {
                    const problem = summary.problems[r.key]
                    const url = photoUrl(r.photo)
                    return (
                      <li key={r.key} className={`px-4 py-3 ${r.checked ? '' : 'bg-gray-50/60'}`}>
                        <div className="grid grid-cols-[28px_minmax(0,1fr)] gap-3 lg:grid-cols-[28px_minmax(0,2.2fr)_minmax(0,1.2fr)_110px_130px_110px_56px] lg:items-start">
                          <input type="checkbox" className="mt-2.5 h-4 w-4 accent-blue-600" checked={r.checked}
                            aria-label={r.existing ? t('Actualizar su precio') : t('Crear este producto')}
                            onChange={(e) => patch(r.key, { checked: e.target.checked })} />
                          <div className="min-w-0">
                            {r.existing ? (
                              <>
                                <p className="truncate py-2 text-sm font-semibold text-gray-900">{r.existing.name}</p>
                                <p className="text-xs font-semibold text-amber-700">
                                  {t('Ya lo tienes')} · {r.checked ? t('se actualizará su precio') : t('se salta')}
                                </p>
                              </>
                            ) : (
                              <input value={r.name} onChange={(e) => patch(r.key, { name: e.target.value })} disabled={!r.checked}
                                aria-label={t('Nombre')} maxLength={150}
                                className={`w-full rounded-lg border px-3 py-2 text-sm font-semibold text-gray-900 outline-none focus:border-blue-400 disabled:bg-transparent disabled:text-gray-400 ${problem === 'NAME' || problem === 'DUPLICATE' ? 'border-red-300' : 'border-gray-200'}`} />
                            )}
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
                              {r.confidence === 'LOW' && !r.existing && <span className="font-semibold text-amber-600">{t('No se veía claro: revísalo')}</span>}
                              {r.brand && !r.existing && <span className="text-gray-400">{t('Marca')}: {r.brand}</span>}
                              {problem && r.checked && <span className="font-semibold text-red-600">{t(PROBLEM_TEXT[problem])}</span>}
                              {r.failure && <span className="font-semibold text-red-600">{r.failure}</span>}
                            </div>
                          </div>
                          {/* en el móvil, los demás campos bajan a una segunda línea */}
                          <div className="col-span-2 grid grid-cols-2 gap-3 lg:col-span-5 lg:grid-cols-[minmax(0,1.2fr)_110px_130px_110px_56px]">
                            {r.existing ? (
                              <>
                                <p className="hidden py-2 text-sm text-gray-400 lg:block">—</p>
                                <p className="hidden py-2 text-sm text-gray-400 lg:block">—</p>
                              </>
                            ) : (
                              <>
                                <label className="min-w-0">
                                  <span className="mb-0.5 block text-[11px] font-bold uppercase tracking-wide text-gray-400 lg:hidden">{t('Categoría')}</span>
                                  <input value={r.category} onChange={(e) => patch(r.key, { category: e.target.value })} disabled={!r.checked} maxLength={60}
                                    placeholder={t('Sin categoría')}
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 disabled:bg-transparent disabled:text-gray-400" />
                                </label>
                                <label>
                                  <span className="mb-0.5 block text-[11px] font-bold uppercase tracking-wide text-gray-400 lg:hidden">{t('Unidad')}</span>
                                  <select value={r.unit} onChange={(e) => patch(r.key, { unit: e.target.value })} disabled={!r.checked}
                                    className="w-full rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm outline-none focus:border-blue-400 disabled:text-gray-400">
                                    {PHOTO_UNITS.map((u) => <option key={u} value={u}>{t(u)}</option>)}
                                  </select>
                                </label>
                              </>
                            )}
                            <label>
                              <span className="mb-0.5 block text-[11px] font-bold uppercase tracking-wide text-gray-400 lg:hidden">{t('Precio de venta')}</span>
                              <div className={`flex items-center rounded-lg border bg-white px-2 ${problem === 'PRICE' || problem === 'NUMBER' ? 'border-red-300' : 'border-gray-200'}`}>
                                <span className="text-xs text-gray-400">{symbol}</span>
                                <input value={r.price} onChange={(e) => patch(r.key, { price: e.target.value })} disabled={!r.checked}
                                  inputMode="decimal" placeholder={r.existing ? '' : t('Variable')}
                                  className="w-full min-w-0 bg-transparent px-1.5 py-2 text-sm outline-none disabled:text-gray-400" />
                              </div>
                              {r.existing && !r.existing.priceIsVariable && (
                                <span className="mt-0.5 block text-[11px] text-gray-400">{t('Hoy')}: {symbol} {r.existing.salePrice}</span>
                              )}
                            </label>
                            {r.existing ? (
                              <p className="py-2 text-sm text-gray-400"><span className="lg:hidden">{t('Stock')}: </span>{r.existing.currentStock}</p>
                            ) : (
                              <label>
                                <span className="mb-0.5 block text-[11px] font-bold uppercase tracking-wide text-gray-400 lg:hidden">{t('Stock inicial')}</span>
                                <input value={r.stock} onChange={(e) => patch(r.key, { stock: e.target.value })} disabled={!r.checked}
                                  inputMode="decimal" placeholder="0"
                                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 disabled:bg-transparent disabled:text-gray-400" />
                              </label>
                            )}
                            <div className="hidden lg:block">
                              {url
                                ? <img src={url} alt={t('Foto {n}', { n: r.photo })} className="h-10 w-10 rounded-lg object-cover ring-1 ring-gray-200" />
                                : <span className="inline-block rounded-md bg-gray-100 px-2 py-1 text-[11px] font-bold text-gray-500">{t('Foto {n}', { n: r.photo })}</span>}
                            </div>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </>
          )}

          {/* botones siempre a la vista */}
          {rows.length > 0 && (
            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 px-4 py-3 backdrop-blur lg:left-64">
              <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
                <button onClick={discard} className="flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-100">
                  <Trash2 size={14} />{t('Descartar')}
                </button>
                <div className="flex items-center gap-3">
                  {!supplierId && summary.create + summary.update > 0 && <span className="hidden text-xs font-semibold text-amber-700 sm:inline">{t('Falta elegir el proveedor')}</span>}
                  <button onClick={confirm} disabled={!summary.ok || saving}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-blue-600/30 hover:bg-blue-700 disabled:opacity-40">
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <PackageCheck size={16} />}
                    {confirmLabel(t, summary)}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 5. Resumen ── */}
      {stage === 'done' && result && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-gray-100 bg-white px-6 py-14 text-center shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><CheckCircle2 size={32} /></div>
          <p className="text-xl font-bold text-gray-900">
            {result.created === 1 ? t('Listo: 1 producto creado') : t('Listo: {n} productos creados', { n: result.created })}
          </p>
          {result.updated > 0 && (
            <p className="text-sm text-gray-500">{result.updated === 1 ? t('y 1 precio actualizado') : t('y {n} precios actualizados', { n: result.updated })}</p>
          )}
          {result.failed.length > 0 && (
            <div className="w-full max-w-lg rounded-xl bg-amber-50 px-4 py-3 text-left text-sm text-amber-900">
              <p className="font-bold">{result.failed.length === 1 ? t('1 no se pudo crear:') : t('{n} no se pudieron crear:', { n: result.failed.length })}</p>
              <ul className="mt-1 list-disc pl-5">
                {result.failed.map((f) => <li key={f.name}><span className="font-semibold">{f.name}</span>: {f.reason}</li>)}
              </ul>
            </div>
          )}
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            {result.failed.length > 0 && rows.length > 0 && (
              <button onClick={() => setStage('review')} className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50">{t('Corregir los que faltan')}</button>
            )}
            <Link to="/products" className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700">
              {t('Ver mis productos')} <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

function confirmLabel(t, { create, update }) {
  if (create > 0 && update > 0) return t('Crear {n} y actualizar {m}', { n: create, m: update })
  if (update > 0) return update === 1 ? t('Actualizar 1 precio') : t('Actualizar {n} precios', { n: update })
  return create === 1 ? t('Crear 1 producto') : t('Crear {n} productos', { n: create })
}

/** Sin cargas: la gratis ya se usó (→ planes) o se acabaron las de hoy. */
function LimitBox({ t, status, message }) {
  const lifetime = status?.limitScope !== 'DAILY'
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <p className="font-bold">{lifetime ? t('Ya usaste tu carga con fotos gratis') : t('Ya hiciste tus cargas con fotos de hoy')}</p>
      <p className="mt-0.5 text-xs">{message ?? (lifetime
        ? t('Con el plan Pro tienes hasta 3 cargas al día. Lo que falte también puedes cargarlo a mano o desde Excel.')
        : t('Mañana tienes más. Mientras tanto puedes cargar productos a mano o desde Excel.'))}</p>
      {lifetime && (
        <Link to="/settings#plan" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:underline">
          {t('Ver planes y subir de plan')} →
        </Link>
      )}
    </div>
  )
}
