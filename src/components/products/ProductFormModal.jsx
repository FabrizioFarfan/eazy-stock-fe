import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2, Camera, CameraOff, HelpCircle, ImagePlus, Trash2, Package, AlertTriangle, EyeOff, Pencil, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useCreateProduct, useUpdateProduct, useFreeCodes, useUploadProductImage, useDeleteProductImage, useProductNameCheck } from '../../hooks/useProducts'
import { productsApi } from '../../services/endpoints/products'
import { formatPrice } from '../../utils/formatMoney'
import { useSuppliers, useCreateSupplier } from '../../hooks/useSuppliers'
import { useBrands, useCreateBrand } from '../../hooks/useBrands'
import { useCategories, useCreateCategory, useSuggestedAttributes } from '../../hooks/useCategories'
import { useLocations, useCreateLocation } from '../../hooks/useLocations'
import { imageSrc, shrinkImage } from '../../utils/productImage'
import { useAuth } from '../../context/AuthContext'
import EntityPicker from '../ui/EntityPicker'
import PriceInput from '../inputs/PriceInput'
import PriceInputModeToggle from '../inputs/PriceInputModeToggle'
import ProductFormTutorial from '../tutorial/ProductFormTutorial'
import { getErrorMessage, getErrorField, getErrorCode } from '../../utils/handleApiError'
import { useParameters } from '../../hooks/useParameters'
import ParameterFields from './ParameterFields'
import { withoutEmptyValues } from '../../utils/parameters'
import { priceWarnings } from '../../utils/priceSanity'
import { useT, dateLocale } from '../../i18n'

const UNIT_OPTIONS = ['unidad', 'metro', 'kilo', 'litro', 'otro']

const makeSchema = (t) => z.object({
  name:          z.string().min(2, t('Mínimo 2 caracteres')),
  sku:           z.string().max(60, t('Máximo 60 caracteres')).optional(),
  unit:          z.string().optional(),
  unitCustom:    z.string().optional(),
  presentation:  z.string().optional(),
  priceIsVariable: z.boolean().optional(),
  description:   z.string().optional(),
  providerCode:  z.string().optional(),
  barcode:       z.string().max(64, t('Máximo 64 caracteres')).optional(),
  // Vacío cuenta como 0: así dice «debe ser mayor a 0» y sigue revisando los demás campos.
  purchasePrice: z.preprocess((v) => (v === '' || v == null ? 0 : v), z.coerce.number({ error: t('Ingresa un número') }).positive(t('Debe ser mayor a 0'))),
  // salePrice se valida condicionalmente: si priceIsVariable=true, no se exige > 0
  salePrice:     z.coerce.number({ error: t('Ingresa un número') }).min(0, t('No puede ser negativo')).optional(),
  // minStock e initialStock admiten decimales para productos por peso/medida;
  // "unidad" exige entero (refine abajo).
  minStock:      z.coerce.number({ error: t('Ingresa un número') }).min(0, t('Mínimo 0')),
  initialStock:  z.coerce.number({ error: t('Ingresa un número') }).min(0, t('Mínimo 0')).optional(),
  expirationDate: z.string().optional(),
}).superRefine((data, ctx) => {
  // minStock / initialStock enteros si el producto no es divisible (unidad)
  const effectiveUnit = data.unit === 'otro' ? (data.unitCustom?.trim() || 'unidad') : (data.unit || 'unidad')
  const indivisible = effectiveUnit.toLowerCase() === 'unidad'
  if (indivisible && data.minStock != null && !Number.isInteger(data.minStock)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['minStock'], message: t('Debe ser entero para productos por unidad') })
  }
  if (indivisible && data.initialStock != null && !Number.isInteger(data.initialStock)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['initialStock'], message: t('Debe ser entero para productos por unidad') })
  }
  // salePrice obligatorio sólo si NO es variable
  if (!data.priceIsVariable && (data.salePrice == null || data.salePrice <= 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['salePrice'],
      message: t('Debe ser mayor a 0'),
    })
  }
})

function Field({ label, required, error, children, field, tour }) {
  return (
    <div className="flex flex-col gap-1" data-field={field} data-tutorial-target={tour}>
      <label className="text-sm font-medium text-gray-700">
        {label}{required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

// Tarjeta de sección del formulario: número + título + para qué sirve.
function FormSection({ n, title, hint, accent = false, children }) {
  return (
    <section className={`rounded-2xl border bg-white p-4 shadow-sm ${accent ? 'border-blue-100' : 'border-gray-100'}`}>
      <div className="mb-3 flex items-center gap-3">
        <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          accent ? 'bg-blue-600 text-white' : 'bg-gray-900 text-white'}`}>{n}</span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900">{title}</p>
          {hint && <p className="truncate text-xs text-gray-400">{hint}</p>}
        </div>
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  )
}

const inputCls =
  'rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 placeholder-gray-400'

/**
 * Sugerencia de códigos libres: huecos que dejó el borrado de productos que
 * nunca se vendieron ni se recibieron.
 *
 * Sugerimos en vez de rellenar solo, a propósito. El código de un producto vive
 * afuera del sistema (sticker en la góndola, lista impresa), así que quien sabe
 * de verdad si un hueco se puede reusar es el dueño, no la app. Si no lo elige,
 * el alta sigue con su numeración normal y el hueco queda ahí, esperando.
 */
function FreeCodesHint({ codes, onPick }) {
  const t = useT()
  const [dismissed, setDismissed] = useState(false)
  if (dismissed || !codes?.length) return null

  const fmt = (iso) => {
    if (!iso) return null
    const d = new Date(iso)
    return Number.isNaN(d.getTime())
      ? null
      : d.toLocaleDateString(dateLocale(), { day: '2-digit', month: '2-digit' })
  }

  return (
    <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-amber-900">
          {codes.length === 1
            ? t('Hay 1 código libre de un producto borrado')
            : t('Hay {n} códigos libres de productos borrados', { n: codes.length })}
        </p>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="shrink-0 text-amber-500 transition hover:text-amber-700"
          title={t('Ocultar sugerencia')}
        >
          <X size={14} />
        </button>
      </div>

      <ul className="mt-1.5 flex flex-col gap-1">
        {codes.slice(0, 5).map((c) => {
          const when = fmt(c.releasedAt)
          return (
            <li key={c.code} className="flex items-center justify-between gap-2">
              <span className="min-w-0 text-xs text-amber-800">
                <span className="font-mono font-semibold">{c.code}</span>
                {c.formerProductName && (
                  <span className="text-amber-700"> · {t('era "{name}"', { name: c.formerProductName })}</span>
                )}
                {when && <span className="text-amber-600"> · {t('liberado el {date}', { date: when })}</span>}
              </span>
              <button
                type="button"
                onClick={() => onPick(c.code)}
                className="shrink-0 rounded-md border border-amber-300 bg-white px-2 py-0.5 text-xs font-medium text-amber-800 transition hover:bg-amber-100"
              >
                {t('Usar')}
              </button>
            </li>
          )
        })}
      </ul>

      {codes.length > 5 && (
        <p className="mt-1 text-[11px] text-amber-600">
          {t('y {n} más…', { n: codes.length - 5 })}
        </p>
      )}
      <p className="mt-1.5 text-[11px] leading-snug text-amber-600">
        {t('Nunca se vendieron ni se recibieron, así que su código no llegó a circular. Si no eliges ninguno, se usa tu numeración normal.')}
      </p>
    </div>
  )
}

/**
 * Aviso en vivo: «ya tienes un producto con este nombre». William agregó
 * «Waype Kg Blanco» dos veces (no sabía que ya lo tenía) y quedó con dos
 * códigos para lo mismo. Rojo si es el MISMO proveedor (casi seguro es el
 * mismo producto), ámbar si es otro proveedor. Si el repetido está oculto,
 * lo que conviene es reactivarlo, no crear otro.
 */
function DuplicateNameHint({ result, checking, onEditExisting, onShowHidden, inReceipt, supplierChosen }) {
  const t = useT()
  if (!result?.exists) {
    return checking ? <p className="mt-1 text-[11px] text-gray-400">{t('Revisando si ya lo tienes…')}</p> : null
  }
  const strong = result.sameSupplier
  const box = strong
    ? 'border-red-200 bg-red-50 text-red-900'
    : 'border-amber-200 bg-amber-50 text-amber-900'
  const iconCls = strong ? 'text-red-500' : 'text-amber-500'
  const btnCls = strong
    ? 'border-red-300 bg-white text-red-800 hover:bg-red-100'
    : 'border-amber-300 bg-white text-amber-800 hover:bg-amber-100'
  const stock = Number(result.currentStock ?? 0)
  return (
    <div className={`mt-2 rounded-lg border px-3 py-2 ${box}`}>
      <div className="flex items-start gap-2">
        {result.active
          ? <AlertTriangle size={15} className={`mt-0.5 shrink-0 ${iconCls}`} />
          : <EyeOff size={15} className={`mt-0.5 shrink-0 ${iconCls}`} />}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold">
            {result.active
              ? (strong
                  ? t('Ya tienes este producto con el mismo proveedor')
                  : supplierChosen
                    ? t('Ya tienes un producto con este nombre (otro proveedor)')
                    : t('Ya tienes un producto con este nombre'))
              : t('Ya tienes este producto, pero está oculto')}
            {result.others > 0 && (
              <span className="font-normal"> · {t('y {n} más con ese nombre', { n: result.others })}</span>
            )}
          </p>
          <p className="mt-0.5 text-xs">
            <span className="font-semibold">{result.name}</span>
            <span className="opacity-80"> · <span className="font-mono">{result.sku}</span></span>
            {result.unit && <span className="opacity-80"> · {result.unit}</span>}
            {result.salePrice != null && Number(result.salePrice) > 0 && (
              <span className="opacity-80"> · {formatPrice(result.salePrice)}</span>
            )}
            {result.supplierName && <span className="opacity-80"> · {result.supplierName}</span>}
            <span className="opacity-80"> · {t('stock {n}', { n: stock })}</span>
          </p>
          <p className="mt-1 text-[11px] leading-snug opacity-80">
            {inReceipt
              ? t('Ya está en tu catálogo: ciérralo y búscalo en la recepción por su nombre o código.')
              : result.active
                ? t('Si es el mismo, no lo crees de nuevo: edítalo o súmale stock. Si de verdad es otro, cambia el nombre (por ejemplo, agrega la presentación) o guarda igual.')
                : t('Reactívalo desde Productos › Ocultos: vuelve con su mismo código e historial. Crear otro te deja dos códigos para lo mismo.')}
          </p>
          {!inReceipt && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {result.active && onEditExisting && (
                <button type="button" onClick={() => onEditExisting(result.id)}
                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium transition ${btnCls}`}>
                  <Pencil size={11} /> {t('Abrir ese producto')}
                </button>
              )}
              {!result.active && onShowHidden && (
                <button type="button" onClick={onShowHidden}
                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium transition ${btnCls}`}>
                  <EyeOff size={11} /> {t('Ver ocultos y reactivar')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Devuelve una función para detectar si el nombre que el usuario está escribiendo
// como "nueva categoría" coincide con un proveedor o marca ya cargado — caso
// real que vimos con un cliente que escribió el nombre de un proveedor en el
// campo "nueva categoría".
function warnIfLooksLikeSupplierOrBrand(suppliers, brands, t) {
  return (raw) => {
    const name = (raw || '').trim()
    if (name.length === 0) return null
    if (name.length > 30) {
      return t('¿Seguro? El nombre es muy largo para una categoría (>30 caracteres).')
    }
    const lower = name.toLowerCase()
    const supplierHit = suppliers.find((s) => s.name.toLowerCase() === lower)
    if (supplierHit) {
      return t('"{name}" ya existe como proveedor. ¿Querías seleccionarlo como proveedor en vez de crear una categoría?', { name: supplierHit.name })
    }
    const brandHit = brands.find((b) => b.name.toLowerCase() === lower)
    if (brandHit) {
      return t('"{name}" ya existe como marca. ¿Querías seleccionarla como marca en vez de crear una categoría?', { name: brandHit.name })
    }
    return null
  }
}

/**
 * `receiptContext` (opcional): el modal se abrió desde una RECEPCIÓN en curso.
 * { supplier: {id, name}, initialName, onCreated(product) } — el proveedor
 * llega FIJO (obvio: es el de la recepción, no se completa ni se cambia),
 * el nombre viene prefilled con lo tipeado en el buscador, el stock inicial
 * se oculta (la recepción es la que suma el stock — sería doble conteo) y el
 * producto creado se devuelve para caer al carrito.
 */
export default function ProductFormModal({ product, onClose, autoTutorial = false, receiptContext = null, onEditExisting = null }) {
  const isEdit = !!product
  const t = useT()
  const schema = useMemo(() => makeSchema(t), [t])
  const { user } = useAuth()
  const create   = useCreateProduct()
  const update   = useUpdateProduct()
  const mutation = isEdit ? update : create
  const isBusy   = mutation.isPending

  // Tutorial interactivo encima del modal. Se enciende cuando lo abre la
  // página (auto-show de primera visita, botón "Tutorial" o trigger desde
  // Ajustes) y también via el botón "?" del header.
  const [showTutorial, setShowTutorial] = useState(autoTutorial && !isEdit)

  // Suppliers, brands, categories
  const { data: suppliersData } = useSuppliers({ size: 200 })
  const { data: brandsData }    = useBrands({ size: 200 })
  const { data: categoriesData } = useCategories({ size: 200 })
  const { data: locationsData }  = useLocations({ size: 200 })
  const suppliers  = suppliersData?.content  ?? []
  const brands     = brandsData?.content     ?? []
  const categories = categoriesData?.content ?? []
  const locations  = locationsData?.content  ?? []

  const createBrand    = useCreateBrand()
  const createSupplier = useCreateSupplier()
  const createCategory = useCreateCategory()
  const createLocation = useCreateLocation()
  const uploadImage    = useUploadProductImage()
  const deleteImage    = useDeleteProductImage()
  // La foto se sube DESPUÉS de guardar el producto: el botón sigue ocupado mientras tanto.
  const photoSyncing   = uploadImage.isPending || deleteImage.isPending

  // ── Foto ──────────────────────────────────────────────────────────────────
  // La foto NO viaja en el JSON del producto: se sube aparte (multipart) recién
  // cuando el producto ya existe. Acá solo la elegimos, la reducimos en el
  // navegador (shrinkImage) y mostramos la vista previa; al guardar se sube.
  const [photoFile,    setPhotoFile]    = useState(null)   // File pendiente de subir
  const [photoPreview, setPhotoPreview] = useState(imageSrc(product?.imageUrl))
  const [photoRemoved, setPhotoRemoved] = useState(false)  // el usuario quitó la foto guardada
  const [photoBusy,    setPhotoBusy]    = useState(false)
  const [photoError,   setPhotoError]   = useState(null)
  const cameraInputRef  = useRef(null)
  const galleryInputRef = useRef(null)

  const handlePhotoPick = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''            // permite volver a elegir el mismo archivo
    if (!file) return
    setPhotoError(null)
    setPhotoBusy(true)
    try {
      const small = await shrinkImage(file)
      if (photoPreview?.startsWith('blob:')) URL.revokeObjectURL(photoPreview)
      setPhotoFile(small)
      setPhotoPreview(URL.createObjectURL(small))
      setPhotoRemoved(false)
    } catch {
      setPhotoError(t('No se pudo leer la imagen'))
    } finally {
      setPhotoBusy(false)
    }
  }

  const handlePhotoRemove = () => {
    if (photoPreview?.startsWith('blob:')) URL.revokeObjectURL(photoPreview)
    setPhotoFile(null)
    setPhotoPreview(null)
    setPhotoRemoved(!!product?.imageUrl)
    setPhotoError(null)
  }

  /** Tras guardar el producto: sube la foto nueva o borra la que se quitó. */
  const syncPhoto = async (productId) => {
    const params = user.role === 'SUPER_ADMIN' && user.businessId ? { businessId: user.businessId } : undefined
    if (photoFile) {
      await uploadImage.mutateAsync({ id: productId, file: photoFile, params })
    } else if (photoRemoved) {
      await deleteImage.mutateAsync({ id: productId, params })
    }
  }

  // Huecos en la numeración (códigos de productos borrados que nunca se usaron).
  // Solo en el alta: en la edición el producto ya tiene su código.
  const { data: freeCodesData } = useFreeCodes({ enabled: !isEdit })
  const freeCodes = isEdit ? [] : (freeCodesData ?? [])

  // Controlled brand/supplier/category (outside RHF schema)
  const [brandId,     setBrandId]     = useState(product?.brandId     ?? null)
  const [supplierId,  setSupplierId]  = useState(product?.supplierId  ?? receiptContext?.supplier?.id ?? null)
  const [categoryId,  setCategoryId]  = useState(product?.categoryId  ?? null)
  const [locationId,  setLocationId]  = useState(product?.locationId  ?? null)

  // Attributes map: Record<string, string>
  const [attributes,  setAttributes]  = useState(product?.attributes  ?? {})

  // Lo que la categoría elegida propone: sale como chips dentro de Parámetros (task 1769, 13-nov-2026).
  const { data: suggestedAttrs = [] } = useSuggestedAttributes(categoryId)
  // Parámetros del negocio (Frank, 4-nov-2026): campos con forma (Sí/No, opciones, número con medida).
  const { data: parameters = [] } = useParameters(user?.role === 'SUPER_ADMIN' && user?.businessId ? { businessId: user.businessId } : {})
  // Aviso de precio raro (William, 4-nov-2026): bajo el costo o cambia más de un 80 % → confirmar.
  const [pricePending, setPricePending] = useState(null)

  // Camera — mirrors ScannerInput logic (BarcodeDetector + ZXing fallback)
  const [hasCameraSupport, setHasCameraSupport] = useState(false)
  const [cameraOpen, setCameraOpen]             = useState(false)
  const videoRef       = useRef(null)
  const streamRef      = useRef(null)
  const detectorRef    = useRef(null)
  const scanTimeoutRef = useRef(null)
  const sessionRef     = useRef(0)    // increments each openCamera; stale callbacks bail
  const firedRef       = useRef(false) // fire-once guard per session
  const isOpeningRef   = useRef(false) // prevent concurrent openCamera (double-tap)

  useEffect(() => {
    setHasCameraSupport(!!navigator.mediaDevices?.getUserMedia)
  }, [])

  useEffect(() => { return () => stopCamera() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const stopCamera = () => {
    if (scanTimeoutRef.current) { clearTimeout(scanTimeoutRef.current); scanTimeoutRef.current = null }
    detectorRef.current?.reset?.()
    detectorRef.current = null
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null }
    if (videoRef.current)  { videoRef.current.srcObject = null }
    setCameraOpen(false)
  }

  const openCamera = async () => {
    if (isOpeningRef.current) return
    isOpeningRef.current = true
    try {
      sessionRef.current++
      firedRef.current = false
      const mySession = sessionRef.current

      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      videoRef.current.srcObject = stream
      await videoRef.current.play()
      setCameraOpen(true)

      if (typeof window.BarcodeDetector !== 'undefined') {
        // ── Path 1: Native BarcodeDetector (Chrome / Edge) ───────────────────
        detectorRef.current = new window.BarcodeDetector({
          formats: ['qr_code', 'code_128', 'ean_13', 'ean_8', 'code_39', 'upc_a', 'upc_e'],
        })
        const scheduleScan = () => {
          scanTimeoutRef.current = setTimeout(async () => {
            if (sessionRef.current !== mySession || !videoRef.current || !detectorRef.current) return
            try {
              const barcodes = await detectorRef.current.detect(videoRef.current)
              if (barcodes.length > 0 && sessionRef.current === mySession && !firedRef.current) {
                firedRef.current = true
                sessionRef.current++
                stopCamera()
                setValue('barcode', barcodes[0].rawValue)
                return
              }
            } catch { /* frame not ready */ }
            if (sessionRef.current === mySession) scheduleScan()
          }, 300)
        }
        scheduleScan()
      } else {
        // ── Path 2: @zxing/browser (Safari, Firefox, all others) ──────────────
        const { BrowserMultiFormatReader } = await import('@zxing/browser')
        const reader = new BrowserMultiFormatReader()
        detectorRef.current = reader
        reader.decodeFromVideoElement(videoRef.current, (result) => {
          if (result && sessionRef.current === mySession && !firedRef.current) {
            firedRef.current = true
            sessionRef.current++
            stopCamera()
            setValue('barcode', result.getText())
          }
        })
      }
    } catch { /* permission denied or device unavailable */ }
    finally { isOpeningRef.current = false }
  }

  // Si la unidad guardada no es una de las opciones standard, mostramos "otro" + input custom
  const initialUnit = product?.unit ?? 'unidad'
  const initialUnitIsStandard = UNIT_OPTIONS.slice(0, -1).includes(initialUnit)

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: isEdit
      ? {
          name:          product.name          ?? '',
          sku:           product.sku           ?? '',
          unit:          initialUnitIsStandard ? initialUnit : 'otro',
          unitCustom:    initialUnitIsStandard ? '' : initialUnit,
          presentation:  product.presentation  ?? '',
          priceIsVariable: !!product.priceIsVariable,
          description:   product.description   ?? '',
          providerCode:  product.providerCode  ?? '',
          barcode:       product.barcode       ?? '',
          purchasePrice: product.purchasePrice ?? '',
          salePrice:     product.priceIsVariable ? '' : (product.salePrice ?? ''),
          minStock:      product.minStock      ?? 0,
          expirationDate: product.expirationDate ?? '',
        }
      : { name: receiptContext?.initialName ?? '', minStock: 0, initialStock: 0, unit: 'unidad', priceIsVariable: false, expirationDate: '' },
  })

  const unitValue = watch('unit')
  const priceIsVariable = watch('priceIsVariable')
  const nameValue = watch('name')

  // «¿Ya tengo un producto con este nombre?» en vivo. En edición solo cuenta
  // si el nombre cambió de verdad (el propio producto no se avisa a sí mismo).
  const compact = (v) => (v ?? '').replace(/\s+/g, '').toLowerCase()
  const nameChanged = !isEdit || compact(nameValue) !== compact(product?.name)
  const nameCheck = useProductNameCheck(
    nameChanged ? nameValue : '',
    supplierId,
    product?.id ?? null,
    user.role === 'SUPER_ADMIN' ? user.businessId : null,
  )
  // 409 DUPLICATE_PRODUCT_NAME: el BE frenó el guardado; guardamos lo tipeado
  // para poder «guardar de todos modos» con allowDuplicateName.
  const [dupPending, setDupPending] = useState(null)

  const openExisting = async (id) => {
    try {
      const r = await productsApi.getById(id)
      if (r.data.data) onEditExisting?.(r.data.data)
    } catch { /* si no carga, el usuario lo busca en la lista */ }
  }
  const showHidden = () => {
    onClose()
    window.dispatchEvent(new CustomEvent('eazystock:show-hidden-products'))
  }

  useEffect(() => {
    if (isEdit) {
      const u = product.unit ?? 'unidad'
      const isStd = UNIT_OPTIONS.slice(0, -1).includes(u)
      reset({
        name:          product.name          ?? '',
        sku:           product.sku           ?? '',
        unit:          isStd ? u : 'otro',
        unitCustom:    isStd ? '' : u,
        presentation:  product.presentation  ?? '',
        priceIsVariable: !!product.priceIsVariable,
        description:   product.description   ?? '',
        providerCode:  product.providerCode  ?? '',
        barcode:       product.barcode       ?? '',
        purchasePrice: product.purchasePrice ?? '',
        salePrice:     product.priceIsVariable ? '' : (product.salePrice ?? ''),
        minStock:      product.minStock      ?? 0,
        expirationDate: product.expirationDate ?? '',
      })
      setBrandId(product.brandId       ?? null)
      setSupplierId(product.supplierId ?? null)
      setCategoryId(product.categoryId ?? null)
      setLocationId(product.locationId ?? null)
      setAttributes(product.attributes ?? {})
      setPhotoFile(null)
      setPhotoPreview(imageSrc(product.imageUrl))
      setPhotoRemoved(false)
    }
  }, [product?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreateLocation = async (name) => {
    const created = await createLocation.mutateAsync({ name })
    setLocationId(created.id)
  }

  const handleCreateBrand = async (name) => {
    const newBrand = await createBrand.mutateAsync({ name })
    setBrandId(newBrand.id)
  }

  const handleCreateSupplier = async (name, extra) => {
    const newSupplier = await createSupplier.mutateAsync({
      name,
      contact: extra.contact || undefined,
      phone:   extra.phone   || undefined,
    })
    setSupplierId(newSupplier.id)
  }

  const handleCreateCategory = async (name) => {
    // Si createCategory falla, la excepción se propaga al EntityPicker que
    // muestra el mensaje sin romper el estado del modal padre.
    const newCategory = await createCategory.mutateAsync({ name })
    setCategoryId(newCategory.id)
  }

  const [supplierError, setSupplierError] = useState(null)
  const formRef = useRef(null)
  // Frank, 7-nov-2026: lo que impide guardar se dice en el pie, siempre a la vista, y un toque lleva al campo: en PC
  // el error puede estar en otra hoja y en el celular muy arriba.
  const FIELD_LABELS = {
    name: t('Nombre'), sku: t('Código del producto'), unit: t('Unidad'), unitCustom: t('Unidad'), presentation: t('Presentación'),
    description: t('Descripción'), providerCode: t('Código proveedor'), barcode: t('Código de barras'),
    purchasePrice: t('P. compra'), salePrice: t('P. venta'), minStock: t('Stock mín.'), initialStock: t('Stock inicial'),
    expirationDate: t('Fecha de vencimiento'),
  }
  const missingSupplier = supplierError && !supplierId
  const problems = [
    ...Object.entries(errors).filter(([, e]) => e?.message).map(([key, e]) => ({ key, label: FIELD_LABELS[key] ?? key, message: e.message })),
    ...(missingSupplier ? [{ key: 'supplier', label: t('Proveedor'), message: supplierError }] : []),
  ]
  const jumpTo = (key) => {
    const form = formRef.current
    if (!form) return
    const el = key === 'supplier'
      ? form.querySelector('[data-tutorial-target="supplier-picker"]')
      : form.querySelector(`[name="${key}"]`) ?? form.querySelector(`[data-field="${key}"]`)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const input = el.matches('input,select,textarea') ? el : el.querySelector('input,select,textarea')
    input?.focus({ preventScroll: true })
  }
  // Campos inválidos: el proveedor no es del formulario, así que se comprueba aquí para decirlo todo de una vez.
  const onInvalid = () => {
    setDupPending(null)
    setPricePending(null)
    setSupplierError(supplierId ? null : t('Elegí un proveedor para este producto'))
  }

  const onSubmit = async (values) => {
    setSupplierError(null)
    setDupPending(null)
    setPricePending(null)
    if (!supplierId) {
      setSupplierError(t('Elegí un proveedor para este producto'))
      return
    }
    // A William un producto de S/ 8 le quedó a S/ 0.80: si el precio queda bajo el costo o
    // cambia más de un 80 %, se pide confirmación enseñando el precio anterior.
    if (!values.__priceOk) {
      const warnings = priceWarnings({
        newPrice: values.priceIsVariable ? null : values.salePrice,
        oldPrice: isEdit && !product.priceIsVariable ? product.salePrice : null,
        cost: values.purchasePrice,
        variable: !!values.priceIsVariable,
      })
      if (warnings.length) { setPricePending({ values, warnings }); return }
    }
    try {
      // Resolve unit: if "otro" → use unitCustom, else use the standard option
      const effectiveUnit = values.unit === 'otro'
        ? (values.unitCustom?.trim() || 'unidad')
        : (values.unit || 'unidad')
      const presentation = values.presentation?.trim() || null

      // initialStock es solo para alta; no viaja en update. sku se manda solo
      // si el usuario escribió algo: en alta vacío = autogenerar; en edición
      // vacío = no tocar el código actual.
      const { unitCustom, initialStock, sku, expirationDate, __priceOk, ...rest } = values // eslint-disable-line no-unused-vars
      const trimmedSku = sku?.trim() || ''
      const expDate = expirationDate?.trim() || ''
      const payload = {
        ...rest,
        ...(trimmedSku && { sku: trimmedSku }),
        ...(expDate && { expirationDate: expDate }),
        unit: effectiveUnit,
        presentation,
        priceIsVariable: !!values.priceIsVariable,
        salePrice: values.priceIsVariable ? 0 : values.salePrice,
        supplierId,
        brandId:     brandId     || null,
        categoryId:  categoryId  || null,
        locationId:  locationId  || null,
        // Al editar va siempre el mapa (vacío = quitarlos todos); con null el API deja los que había.
        attributes:  isEdit || Object.keys(withoutEmptyValues(attributes)).length > 0 ? withoutEmptyValues(attributes) : null,
      }

      let savedId
      if (isEdit) {
        await update.mutateAsync({
          id: product.id,
          data: {
            ...payload,
            // supplier ya no se "clearea" — el campo es obligatorio. Brand,
            // category y location siguen siendo opcionales. Presentation se borra explícito.
            clearBrandId:    !brandId,
            clearCategoryId: !categoryId,
            clearLocationId: !locationId,
            clearPresentation: !presentation,
            clearExpirationDate: !expDate,
            clearBarcode: !(values.barcode?.trim()),
          },
        })
        savedId = product.id
      } else {
        // Desde la recepción el stock inicial NO aplica: lo suma la recepción.
        const withInitial = !receiptContext && initialStock && Number(initialStock) > 0
          ? { ...payload, initialStock: Number(initialStock) }
          : payload
        const finalPayload = user.role === 'SUPER_ADMIN'
          ? { ...withInitial, businessId: user.businessId }
          : withInitial
        const created = await create.mutateAsync(finalPayload)
        savedId = created.id
        receiptContext?.onCreated?.(created)
      }
      // La foto va aparte: si falla, el producto YA quedó guardado — avisamos
      // sin dejar el modal colgado (se puede reintentar desde Editar).
      try {
        await syncPhoto(savedId)
      } catch (photoErr) {
        toast.error(t('El producto se guardó, pero la foto no se pudo subir: {msg}', { msg: getErrorMessage(photoErr) }))
      }
      onClose()
    } catch (err) {
      const field = getErrorField(err)
      const code  = getErrorCode(err)
      const known = ['name', 'sku', 'unit', 'description', 'providerCode', 'barcode', 'purchasePrice', 'salePrice', 'minStock']
      if (code === 'DUPLICATE_PRODUCT_NAME') {
        // No es un error de tipeo: es una decisión. Se muestra abajo con el
        // botón «guardar de todos modos» y se marca el campo.
        setDupPending({ values, message: getErrorMessage(err) })
        setError('name', { type: 'server', message: t('Ya tienes un producto con este nombre') })
      } else if (code === 'DUPLICATE_SKU') {
        setError('sku', {
          type: 'server',
          message: `${getErrorMessage(err)}. ${t('Usa otro código.')}`,
        })
      } else if (code === 'DUPLICATE_PROVIDER_CODE_FOR_SUPPLIER') {
        // El BE ya nombra el producto existente; sumamos la acción a seguir.
        setError('providerCode', {
          type: 'server',
          message: `${getErrorMessage(err)}. ${t('Cámbialo o edita el producto existente.')}`,
        })
      } else if (field && known.includes(field)) {
        setError(field, { type: 'server', message: getErrorMessage(err) })
      } else if (field === 'supplierId') {
        setSupplierError(getErrorMessage(err))
      }
      // Banner global queda en `mutation.isError` con `getErrorMessage(mutation.error)`.
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
      <div className="flex max-h-[94dvh] w-full max-w-xl flex-col rounded-2xl bg-white shadow-2xl md:max-w-5xl xl:h-[94dvh] xl:max-w-[1560px] 2xl:max-w-[1760px]" data-testid="product-form-modal">

        {/* Cabecera */}
        <div className="flex flex-shrink-0 items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/30">
              {isEdit ? <Pencil size={20} /> : <Package size={22} />}
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-lg font-extrabold text-gray-900 sm:text-xl">
                {isEdit ? t('Editar producto') : t('Nuevo producto')}
              </h3>
              <p className="truncate text-xs text-gray-400">
                {t('Lo marcado con * es obligatorio; lo demás lo puedes completar después.')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowTutorial(true)}
              title={t('Ver tutorial: cómo agregar un producto')}
              className="flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-sm font-medium text-gray-500 hover:bg-blue-50 hover:text-blue-600"
            >
              <HelpCircle size={17} /><span className="hidden sm:inline">{t('Tutorial')}</span>
            </button>
            <button onClick={onClose} aria-label={t('Cerrar')}
              className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Cuerpo (Frank, 4-nov-2026): en PC, CUATRO hojas de un vistazo y el modal NO se desliza entero: cada hoja
            desliza por su cuenta si se le queda corta la pantalla (listas largas de proveedores, categorías, parámetros).
            Orden: foto + PRECIOS (lo más importante) | qué es | códigos y parámetros | de dónde viene y dónde está.
            En tablet, dos columnas; en el celular, una sola de arriba abajo. */}
        <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate className="flex min-h-0 flex-1 flex-col" ref={formRef}>
          <div className="min-h-0 flex-1 overflow-y-auto bg-gray-50/60 xl:relative xl:overflow-hidden">
            <div className="grid grid-cols-1 gap-4 p-4 sm:p-5 md:grid-cols-2 xl:absolute xl:inset-0 xl:grid-cols-4 xl:gap-4 xl:p-4" data-testid="product-form-grid">

              {/* Hoja 1: foto + precios y stock */}
              <div className="flex min-w-0 flex-col gap-4 xl:min-h-0 xl:overflow-y-auto xl:pr-1" data-testid="sheet-1">
              {/* Foto del producto: para que el vendedor sepa cómo es (William).
                  Se reduce en el navegador y se sube aparte al guardar. */}
              <div data-tutorial-target="photo" className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <input ref={cameraInputRef}  type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoPick} />
              <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoPick} />
                <div className="flex items-center gap-4">
                  {photoPreview ? (
                    <img src={photoPreview} alt="" className="h-24 w-24 flex-shrink-0 rounded-xl border border-gray-100 bg-gray-50 object-contain xl:h-28 xl:w-28" />
                  ) : (
                    <button type="button" onClick={() => galleryInputRef.current?.click()} disabled={photoBusy}
                      className="flex h-24 w-24 flex-shrink-0 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 text-gray-300 transition-colors hover:border-blue-300 hover:text-blue-400 xl:h-28 xl:w-28">
                      {photoBusy ? <Loader2 size={26} className="animate-spin" /> : <ImagePlus size={32} strokeWidth={1.6} />}
                      <span className="px-1 text-center text-[10px] font-medium leading-tight xl:text-[11px]">{t('Subir foto')}</span>
                    </button>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gray-900">{t('Foto del producto')}</p>
                    <p className="mt-0.5 text-[11px] leading-snug text-gray-400 xl:hidden">
                      {t('Opcional · Se ve en el detalle del producto y como miniatura en las listas, para que el vendedor reconozca el producto de un vistazo.')}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <button type="button" onClick={() => cameraInputRef.current?.click()} disabled={photoBusy}
                        className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 sm:hidden">
                        <Camera size={13} /> {t('Tomar foto')}
                      </button>
                      <button type="button" onClick={() => galleryInputRef.current?.click()} disabled={photoBusy}
                        className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                        <ImagePlus size={13} /> {photoPreview ? t('Cambiar foto') : t('Elegir imagen')}
                      </button>
                      {photoPreview && (
                        <button type="button" onClick={handlePhotoRemove} disabled={photoBusy}
                          className="flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">
                          <Trash2 size={13} /> {t('Quitar foto')}
                        </button>
                      )}
                    </div>
                    {photoBusy && <p className="mt-1 text-[11px] text-gray-400">{t('Procesando foto...')}</p>}
                    {photoError && <p className="mt-1 text-xs text-red-500">{photoError}</p>}
                  </div>
                </div>
              </div>

              {/* PRECIOS Y STOCK primero (Frank: «lo más importante») */}
              <div>
                <FormSection n={1} title={t('Precios y stock')} hint={t('Lo que cuesta, lo que cobras y cuánto tienes')} accent>
                  {/* Checkbox precio variable */}
                  <label data-tutorial-target="price-variable" className="flex cursor-pointer items-start gap-2 rounded-lg border border-gray-200 px-3 py-2 hover:bg-gray-50">
                    <input
                      type="checkbox"
                      {...register('priceIsVariable')}
                      className="mt-0.5 accent-blue-600"
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{t('Precio variable')}</p>
                      <p className="text-xs text-gray-500 xl:hidden">
                        {t('El precio se define al momento de vender (se negocia con el cliente). En el POS pedirá un precio obligatorio antes de cobrar.')}
                      </p>
                    </div>
                  </label>

                  {/* Precios + Stock mínimo */}
                  <div>
                    <div data-tutorial-target="price-format" className="mb-3 flex flex-wrap items-center justify-end gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-gray-400">{t('Formato del precio')}</span>
                        <PriceInputModeToggle />
                      </div>
                    </div>
                    {/* 1 columna en móvil, 2 en adelante: el modo "6 decimales" del
                        PriceInput (dos casillas + punto) necesita ancho — con 3
                        columnas fijas se rompía el layout. Con 2 columnas los
                        precios quedan en una fila y los stocks en la siguiente. */}
                    <div data-tutorial-target="price-fields" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                    <Controller
                      control={control}
                      name="purchasePrice"
                      render={({ field }) => (
                        <div data-field="purchasePrice"><PriceInput
                          label={<>{t('P. compra')} <span className="text-red-500">*</span></>}
                          value={field.value === '' ? null : field.value}
                          onChange={(v) => field.onChange(v ?? '')}
                          error={errors.purchasePrice?.message}
                        /></div>
                      )}
                    />
                    <Controller
                      control={control}
                      name="salePrice"
                      render={({ field }) => (
                        <div data-field="salePrice"><PriceInput
                          label={priceIsVariable
                            ? <span className="text-gray-400">{t('P. venta (variable)')}</span>
                            : <>{t('P. venta')} <span className="text-red-500">*</span></>}
                          value={priceIsVariable ? null : (field.value === '' ? null : field.value)}
                          onChange={(v) => field.onChange(v ?? '')}
                          error={errors.salePrice?.message}
                          disabled={priceIsVariable}
                        /></div>
                      )}
                    />
                    </div>
                    {/* Stock mínimo e inicial: siempre a dos columnas (son cortos) */}
                    <div data-tutorial-target="stock-fields" className="grid grid-cols-2 gap-3">
                    <Field field="minStock" label={t('Stock mín.')} required error={errors.minStock?.message}>
                      <input {...register('minStock')} type="number" step={unitValue === 'unidad' ? '1' : '0.001'} min="0" placeholder="0" className={inputCls} />
                    </Field>
                    {!isEdit && !receiptContext && (
                      <Field field="initialStock" label={t('Stock inicial')} error={errors.initialStock?.message}>
                        <input {...register('initialStock')} type="number" step={unitValue === 'unidad' ? '1' : '0.001'} min="0" placeholder="0" className={inputCls} />
                      </Field>
                    )}
                    </div>

                    {/* Fecha de vencimiento (opcional) */}
                    <div data-tutorial-target="expiry" className="mt-3">
                      <Field field="expirationDate" label={t('Fecha de vencimiento')} error={errors.expirationDate?.message}>
                        <input {...register('expirationDate')} type="date" className={inputCls} />
                        <p className="text-xs text-gray-400 mt-0.5 xl:hidden">
                          {t('Opcional · Para productos que caducan (farmacia, alimentos). La app te avisa cuando falte poco para que venza.')}
                        </p>
                      </Field>
                    </div>
                  </div>

                </FormSection>
              </div>
              </div>

              {/* Hoja 2: qué es */}
              <div className="flex min-w-0 flex-col gap-4 xl:min-h-0 xl:overflow-y-auto xl:pr-1" data-testid="sheet-2">
                <FormSection n={2} title={t('Qué es')} hint={t('Nombre, unidad, código y descripción')}>
                  {/* Nombre + Unidad + Presentación */}
                  <div data-tutorial-target="name-unit" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="sm:col-span-2">
                      <Field field="name" label={t('Nombre')} required error={errors.name?.message}>
                        <input {...register('name')} placeholder={t('Ej. Aceite 5W30')} className={`${inputCls} w-full text-base font-semibold`} />
                      </Field>
                    </div>
                    <Field label={t('Unidad')} error={errors.unit?.message}>
                      <select {...register('unit')} className={inputCls}>
                        <option value="unidad">{t('unidad')}</option>
                        <option value="metro">{t('metro')}</option>
                        <option value="kilo">{t('kilo')}</option>
                        <option value="litro">{t('litro')}</option>
                        <option value="otro">{t('otro...')}</option>
                      </select>
                      {unitValue === 'otro' && (
                        <input
                          {...register('unitCustom')}
                          placeholder={t('Especificá la unidad (ej. galón, par)')}
                          className={`${inputCls} mt-1.5`}
                        />
                      )}
                    </Field>
                  </div>
                  <DuplicateNameHint
                    result={nameCheck.result}
                    checking={nameCheck.checking}
                    onEditExisting={onEditExisting ? openExisting : null}
                    onShowHidden={showHidden}
                    inReceipt={!!receiptContext}
                    supplierChosen={!!supplierId}
                  />

                  {/* Código del producto (SKU) */}
                  <Field field="sku" tour="sku" label={t('Código del producto')} error={errors.sku?.message}>
                    <input
                      {...register('sku')}
                      placeholder={isEdit ? t('Código del producto') : t('Se genera automáticamente si lo dejas vacío')}
                      className={`${inputCls} font-mono ${
                        errors.sku ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : ''
                      }`}
                      autoComplete="off"
                      spellCheck={false}
                    />
                    <p className="text-xs text-gray-400 mt-0.5">
                      {isEdit
                        ? t('Código interno único. Cámbialo solo si necesitas corregirlo.')
                        : t('Opcional · Si lo dejas vacío, seguimos tu numeración automáticamente.')}
                    </p>
                    <FreeCodesHint codes={freeCodes} onPick={(code) => setValue('sku', code)} />
                  </Field>

                  <Field tour="presentation" label={t('Presentación')} error={errors.presentation?.message}>
                    <input
                      {...register('presentation')}
                      placeholder={t('Ej: Saco de 25kg, Caja de 100, Rollo de 50m')}
                      className={inputCls}
                    />
                    <p className="text-xs text-gray-400 mt-0.5 xl:hidden">
                      {t('Opcional · Cómo viene presentado el producto. No afecta cómo se vende.')}
                    </p>
                  </Field>

                  {/* Descripción */}
                  <Field tour="description" label={t('Descripción')} error={errors.description?.message}>
                    <textarea
                      {...register('description')}
                      rows={2}
                      placeholder={t('Descripción opcional')}
                      className={`${inputCls} resize-none`}
                    />
                  </Field>

                </FormSection>


              </div>

              {/* Hoja 3: códigos, parámetros y detalles */}
              <div className="flex min-w-0 flex-col gap-4 xl:min-h-0 xl:overflow-y-auto xl:pr-1" data-testid="sheet-3">
                <FormSection n={3} title={t('Códigos y parámetros')} hint={t('Opcional · para el escáner, para filtrar y para distinguirlo')}>
                  {/* En PC la hoja es estrecha: los dos códigos van uno debajo del otro (se encimaban, Frank 4-nov) */}
                  <div data-tutorial-target="codes" className="grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-1">
                    {/* Código de barras de fábrica: el EAN impreso en el empaque por el
                        fabricante (Sony pone el código; el distribuidor no lo cambia).
                        Acá vive el escáner — es lo que la pistola/cámara lee. */}
                    <Field field="barcode" label={t('Código de barras')} error={errors.barcode?.message}>
                      <div className="flex gap-1.5">
                        <input
                          {...register('barcode')}
                          placeholder={t('EAN del empaque, ej. 7501031311309 (opcional)')}
                          inputMode="numeric"
                          className={`min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm text-gray-900 outline-none transition placeholder-gray-400 ${
                            errors.barcode
                              ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                              : 'border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'
                          }`}
                        />
                        {hasCameraSupport && (
                          <button
                            type="button"
                            onClick={cameraOpen ? stopCamera : openCamera}
                            title={cameraOpen ? t('Cerrar cámara') : t('Escanear código de barras')}
                            className={`flex items-center rounded-lg px-2.5 transition ${
                              cameraOpen
                                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                : 'border border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {cameraOpen ? <CameraOff size={15} /> : <Camera size={15} />}
                          </button>
                        )}
                      </div>
                      {hasCameraSupport && (
                        <div className={cameraOpen ? 'mt-1.5 block' : 'hidden'}>
                          <div className="relative overflow-hidden rounded-lg border border-blue-200 bg-black">
                            <video ref={videoRef} className="w-full" style={{ maxHeight: 140 }} playsInline muted />
                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                              <div className="h-14 w-32 rounded border-2 border-blue-500 opacity-80" />
                            </div>
                          </div>
                        </div>
                      )}
                    </Field>

                    {/* Código proveedor: el código INTERNO del distribuidor (sin barra) */}
                    <Field field="providerCode" label={t('Código proveedor')} error={errors.providerCode?.message}>
                      <input
                        {...register('providerCode')}
                        placeholder={t('Código interno del proveedor (opcional)')}
                        className={`w-full min-w-0 rounded-lg border px-3 py-2 text-sm text-gray-900 outline-none transition placeholder-gray-400 ${
                          errors.providerCode
                            ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                            : 'border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'
                        }`}
                      />
                    </Field>

                  </div>

                  {/* Parámetros del negocio (Frank, 4-nov-2026): Artesanal Sí/No, Color, Largo cm… se filtran en Productos e Inventario */}
                  <div data-tutorial-target="parameters" className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700">{t('Parámetros')} <span className="text-xs font-normal text-gray-400">· {t('rellena solo los que apliquen; por estos se filtra')}</span></label>
                    <ParameterFields parameters={parameters} attributes={attributes} onChange={setAttributes} columns={2} suggested={suggestedAttrs} />
                  </div>

                </FormSection>
              </div>


              {/* Hoja 4: de dónde viene y dónde está (sus listas largas deslizan dentro de la hoja) */}
              <div className="flex min-w-0 flex-col gap-4 xl:min-h-0 xl:overflow-y-auto xl:pr-1 xl:[&_.max-h-40]:max-h-[7.5rem]" data-testid="sheet-4">
                <FormSection n={4} title={t('De dónde viene y dónde está')} hint={t('Proveedor, marca, categoría y ubicación · por estos también se filtra')}>
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-1">
                    {/* Supplier picker — obligatorio */}
                    <div data-tutorial-target="supplier-picker">
                      {receiptContext ? (
                        // Desde la recepción el proveedor YA está elegido: fijo, sin picker.
                        <div>
                          <p className="mb-1.5 text-sm font-medium text-gray-700">{t('Proveedor')}</p>
                          <div className="flex items-center gap-2 rounded-xl border border-blue-300 bg-blue-50 px-3 py-2">
                            <span className="text-sm font-semibold text-blue-900">{receiptContext.supplier.name}</span>
                            <span className="text-xs text-blue-700">· {t('el de la recepción en curso')}</span>
                          </div>
                        </div>
                      ) : (
                      <EntityPicker
                        label={<>{t('Proveedor')} <span className="text-red-500">*</span></>}
                        items={suppliers}
                        value={supplierId}
                        onChange={(v) => { setSupplierId(v); setSupplierError(null) }}
                        onCreate={handleCreateSupplier}
                        extraFields={[
                          { name: 'contact', placeholder: t('Contacto (opcional)') },
                          { name: 'phone',   placeholder: t('Teléfono (opcional)')  },
                        ]}
                        placeholder={t('Buscar proveedor...')}
                        createLabel={t('Nuevo proveedor')}
                        isCreating={createSupplier.isPending}
                      />
                      )}
                      {supplierError && (
                        <p className="mt-1 text-xs text-red-500">{supplierError}</p>
                      )}
                      {/* Pista cuando el producto está vinculado al placeholder */}
                      {isEdit && suppliers.find((s) => s.id === supplierId)?.placeholderForUnassigned && (
                        <p className="mt-1 text-xs text-amber-700">
                          {t('Este producto está sin proveedor real asignado. Cambialo al proveedor correspondiente.')}
                        </p>
                      )}
                    </div>

                    {/* Brand picker */}
                    <div data-tutorial-target="brand-picker">
                      <EntityPicker
                        label={t('Marca')}
                        items={brands}
                        value={brandId}
                        onChange={setBrandId}
                        onCreate={handleCreateBrand}
                        placeholder={t('Buscar marca...')}
                        createLabel={t('Nueva marca')}
                        isCreating={createBrand.isPending}
                      />
                    </div>

                    {/* Category picker */}
                    <div data-tutorial-target="category-picker">
                      <EntityPicker
                        label={t('Categoría del producto')}
                        helperText={t('Ej: Clavos, Tornillos, Cemento, Pinturas')}
                        items={categories}
                        value={categoryId}
                        onChange={setCategoryId}
                        onCreate={handleCreateCategory}
                        placeholder={t('Buscar categoría...')}
                        createLabel={t('Nueva categoría')}
                        createButtonLabel={t('Crear categoría')}
                        newNamePlaceholder={t('Nombre de la nueva categoría (ej: Líquidos, Pinturas)')}
                        warnIfLikely={warnIfLooksLikeSupplierOrBrand(suppliers, brands, t)}
                        isCreating={createCategory.isPending}
                      />
                    </div>

                    {/* Ubicación física: en qué almacén / estante está (pedido de William) */}
                    <div data-tutorial-target="location-picker">
                      <EntityPicker
                        label={t('Ubicación en el negocio')}
                        helperText={t('Ej: Almacén 1, Estante B3, Vitrina')}
                        items={locations}
                        value={locationId}
                        onChange={setLocationId}
                        onCreate={handleCreateLocation}
                        placeholder={t('Buscar ubicación...')}
                        createLabel={t('Nueva ubicación')}
                        createButtonLabel={t('Crear ubicación')}
                        newNamePlaceholder={t('Nombre de la nueva ubicación (ej: Almacén 2)')}
                        isCreating={createLocation.isPending}
                      />
                    </div>

                  </div>
                </FormSection>
              </div>
            </div>
          </div>

          {/* Pie: avisos (precio raro, nombre repetido, error) + botones, siempre a la vista */}
          <div className="flex flex-shrink-0 flex-col gap-3 border-t border-gray-100 bg-white px-5 py-3 sm:px-6">
              {pricePending ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3" data-testid="price-warning">
                  <p className="flex items-start gap-2 text-sm font-semibold text-amber-900">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-500" />
                    <span>{t('¿Seguro con este precio de venta?')}</span>
                  </p>
                  <ul className="mt-1.5 space-y-1 text-xs text-amber-800">
                    {pricePending.warnings.map((w) => (
                      <li key={w.code}>
                        {w.code === 'BELOW_COST'
                          ? t('Queda por DEBAJO del costo: vendes a {price} y te cuesta {cost}.', { price: formatPrice(w.newPrice), cost: formatPrice(w.cost) })
                          : w.down
                            ? t('Baja un {pct} %: antes costaba {old} y ahora {price}.', { pct: w.pct, old: formatPrice(w.oldPrice), price: formatPrice(w.newPrice) })
                            : t('Sube un {pct} %: antes costaba {old} y ahora {price}.', { pct: w.pct, old: formatPrice(w.oldPrice), price: formatPrice(w.newPrice) })}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-1 text-xs text-amber-800">{t('No se guardó. A veces es un cero de más o de menos; revísalo o guárdalo así si es correcto.')}</p>
                  <div className="mt-2 flex flex-wrap justify-end gap-2">
                    <button type="button" onClick={() => setPricePending(null)}
                      className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100">
                      {t('Revisar el precio')}
                    </button>
                    <button type="button" disabled={isBusy} data-testid="price-warning-confirm"
                      onClick={() => onSubmit({ ...pricePending.values, __priceOk: true })}
                      className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-60">
                      {t('Sí, guardar con este precio')}
                    </button>
                  </div>
                </div>
              ) : dupPending ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="flex items-start gap-2 text-sm font-semibold text-amber-900">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-500" />
                    <span>{dupPending.message}</span>
                  </p>
                  <p className="mt-1 text-xs text-amber-800">
                    {t('No se guardó. Si es el mismo producto, edita el que ya tienes; si es otro distinto, puedes guardarlo igual.')}
                  </p>
                  <div className="mt-2 flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setDupPending(null)}
                      className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100"
                    >
                      {t('Revisar el nombre')}
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => onSubmit({ ...dupPending.values, allowDuplicateName: true })}
                      className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
                    >
                      {isEdit ? t('Guardar de todos modos') : t('Crear de todos modos')}
                    </button>
                  </div>
                </div>
              ) : problems.length > 0 ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5" data-testid="form-problems" role="alert">
                  <p className="text-sm font-semibold text-red-700">{t('Para guardar, revisa esto:')}</p>
                  <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                    {problems.map((p) => (
                      <li key={p.key} className="text-sm text-red-700">
                        <button type="button" onClick={() => jumpTo(p.key)} className="text-left underline-offset-2 hover:underline">
                          <strong className="font-semibold">{p.label}:</strong> {p.message}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : mutation.isError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
                  {getErrorMessage(mutation.error)}
                </p>
              )}
            </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100"
            >
              {t('Cancelar')}
            </button>
            <button
              type="submit"
              disabled={isBusy || photoSyncing}
              data-tutorial-target="save-button"
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-600/30 hover:bg-blue-700 disabled:opacity-60"
            >
              {(isBusy || photoSyncing) ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              {isBusy || photoSyncing ? t('Guardando...') : isEdit ? t('Guardar cambios') : t('Crear producto')}
            </button>
          </div>
        </form>
      </div>

      {showTutorial && <ProductFormTutorial onClose={() => setShowTutorial(false)} />}
    </div>
  )
}
