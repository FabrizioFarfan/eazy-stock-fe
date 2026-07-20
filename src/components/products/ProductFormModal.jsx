import { useEffect, useRef, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2, Camera, CameraOff, Plus, FolderOpen, HelpCircle } from 'lucide-react'
import { useCreateProduct, useUpdateProduct } from '../../hooks/useProducts'
import { useSuppliers, useCreateSupplier } from '../../hooks/useSuppliers'
import { useBrands, useCreateBrand } from '../../hooks/useBrands'
import { useCategories, useCreateCategory, useSuggestedAttributes } from '../../hooks/useCategories'
import { useAuth } from '../../context/AuthContext'
import EntityPicker from '../ui/EntityPicker'
import PriceInput from '../inputs/PriceInput'
import PriceInputModeToggle from '../inputs/PriceInputModeToggle'
import ProductFormTutorial from '../tutorial/ProductFormTutorial'
import { getErrorMessage, getErrorField, getErrorCode } from '../../utils/handleApiError'

const UNIT_OPTIONS = ['unidad', 'metro', 'kilo', 'litro', 'otro']

const schema = z.object({
  name:          z.string().min(2, 'Mínimo 2 caracteres'),
  sku:           z.string().max(60, 'Máximo 60 caracteres').optional(),
  unit:          z.string().optional(),
  unitCustom:    z.string().optional(),
  presentation:  z.string().optional(),
  priceIsVariable: z.boolean().optional(),
  description:   z.string().optional(),
  providerCode:  z.string().optional(),
  purchasePrice: z.coerce.number({ invalid_type_error: 'Ingresa un número' }).positive('Debe ser mayor a 0'),
  // salePrice se valida condicionalmente: si priceIsVariable=true, no se exige > 0
  salePrice:     z.coerce.number({ invalid_type_error: 'Ingresa un número' }).min(0, 'No puede ser negativo').optional(),
  // minStock e initialStock admiten decimales para productos por peso/medida;
  // "unidad" exige entero (refine abajo).
  minStock:      z.coerce.number({ invalid_type_error: 'Ingresa un número' }).min(0, 'Mínimo 0'),
  initialStock:  z.coerce.number({ invalid_type_error: 'Ingresa un número' }).min(0, 'Mínimo 0').optional(),
}).superRefine((data, ctx) => {
  // minStock / initialStock enteros si el producto no es divisible (unidad)
  const effectiveUnit = data.unit === 'otro' ? (data.unitCustom?.trim() || 'unidad') : (data.unit || 'unidad')
  const indivisible = effectiveUnit.toLowerCase() === 'unidad'
  if (indivisible && data.minStock != null && !Number.isInteger(data.minStock)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['minStock'], message: 'Debe ser entero para productos por unidad' })
  }
  if (indivisible && data.initialStock != null && !Number.isInteger(data.initialStock)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['initialStock'], message: 'Debe ser entero para productos por unidad' })
  }
  // salePrice obligatorio sólo si NO es variable
  if (!data.priceIsVariable && (data.salePrice == null || data.salePrice <= 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['salePrice'],
      message: 'Debe ser mayor a 0',
    })
  }
})

function Field({ label, required, error, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">
        {label}{required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

const inputCls =
  'rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 placeholder-gray-400'

// Devuelve una función para detectar si el nombre que el usuario está escribiendo
// como "nueva categoría" coincide con un proveedor o marca ya cargado — caso
// real que vimos con un cliente que escribió el nombre de un proveedor en el
// campo "nueva categoría".
function warnIfLooksLikeSupplierOrBrand(suppliers, brands) {
  return (raw) => {
    const name = (raw || '').trim()
    if (name.length === 0) return null
    if (name.length > 30) {
      return '¿Seguro? El nombre es muy largo para una categoría (>30 caracteres).'
    }
    const lower = name.toLowerCase()
    const supplierHit = suppliers.find((s) => s.name.toLowerCase() === lower)
    if (supplierHit) {
      return `"${supplierHit.name}" ya existe como proveedor. ¿Querías seleccionarlo como proveedor en vez de crear una categoría?`
    }
    const brandHit = brands.find((b) => b.name.toLowerCase() === lower)
    if (brandHit) {
      return `"${brandHit.name}" ya existe como marca. ¿Querías seleccionarla como marca en vez de crear una categoría?`
    }
    return null
  }
}

export default function ProductFormModal({ product, onClose, autoTutorial = false }) {
  const isEdit = !!product
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
  const suppliers  = suppliersData?.content  ?? []
  const brands     = brandsData?.content     ?? []
  const categories = categoriesData?.content ?? []

  const createBrand    = useCreateBrand()
  const createSupplier = useCreateSupplier()
  const createCategory = useCreateCategory()

  // Controlled brand/supplier/category (outside RHF schema)
  const [brandId,     setBrandId]     = useState(product?.brandId     ?? null)
  const [supplierId,  setSupplierId]  = useState(product?.supplierId  ?? null)
  const [categoryId,  setCategoryId]  = useState(product?.categoryId  ?? null)

  // Attributes map: Record<string, string>
  const [attributes,  setAttributes]  = useState(product?.attributes  ?? {})
  const [attrKey,     setAttrKey]     = useState('')
  const [attrVal,     setAttrVal]     = useState('')

  // Suggested attributes from selected category
  const { data: suggestedAttrs = [] } = useSuggestedAttributes(categoryId)

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
                setValue('providerCode', barcodes[0].rawValue)
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
            setValue('providerCode', result.getText())
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
          purchasePrice: product.purchasePrice ?? '',
          salePrice:     product.priceIsVariable ? '' : (product.salePrice ?? ''),
          minStock:      product.minStock      ?? 0,
        }
      : { minStock: 0, initialStock: 0, unit: 'unidad', priceIsVariable: false },
  })

  const unitValue = watch('unit')
  const priceIsVariable = watch('priceIsVariable')

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
        purchasePrice: product.purchasePrice ?? '',
        salePrice:     product.priceIsVariable ? '' : (product.salePrice ?? ''),
        minStock:      product.minStock      ?? 0,
      })
      setBrandId(product.brandId       ?? null)
      setSupplierId(product.supplierId ?? null)
      setCategoryId(product.categoryId ?? null)
      setAttributes(product.attributes ?? {})
    }
  }, [product?.id]) // eslint-disable-line react-hooks/exhaustive-deps

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

  // Attribute helpers
  const addAttribute = (key = attrKey, val = attrVal) => {
    const k = key.trim()
    const v = val.trim()
    if (!k) return
    setAttributes((prev) => ({ ...prev, [k]: v }))
    setAttrKey('')
    setAttrVal('')
  }

  const removeAttribute = (key) => {
    setAttributes((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const applySuggestedAttr = (attr) => {
    if (!(attr in attributes)) {
      setAttributes((prev) => ({ ...prev, [attr]: '' }))
    }
  }

  const [supplierError, setSupplierError] = useState(null)

  const onSubmit = async (values) => {
    setSupplierError(null)
    if (!supplierId) {
      setSupplierError('Elegí un proveedor para este producto')
      return
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
      const { unitCustom, initialStock, sku, ...rest } = values
      const trimmedSku = sku?.trim() || ''
      const payload = {
        ...rest,
        ...(trimmedSku && { sku: trimmedSku }),
        unit: effectiveUnit,
        presentation,
        priceIsVariable: !!values.priceIsVariable,
        salePrice: values.priceIsVariable ? 0 : values.salePrice,
        supplierId,
        brandId:     brandId     || null,
        categoryId:  categoryId  || null,
        attributes:  Object.keys(attributes).length > 0 ? attributes : null,
      }

      if (isEdit) {
        await update.mutateAsync({
          id: product.id,
          data: {
            ...payload,
            // supplier ya no se "clearea" — el campo es obligatorio. Brand y
            // category siguen siendo opcionales. Presentation se borra explícito.
            clearBrandId:    !brandId,
            clearCategoryId: !categoryId,
            clearPresentation: !presentation,
          },
        })
      } else {
        const withInitial = initialStock && Number(initialStock) > 0
          ? { ...payload, initialStock: Number(initialStock) }
          : payload
        const finalPayload = user.role === 'SUPER_ADMIN'
          ? { ...withInitial, businessId: user.businessId }
          : withInitial
        await create.mutateAsync(finalPayload)
      }
      onClose()
    } catch (err) {
      const field = getErrorField(err)
      const code  = getErrorCode(err)
      const known = ['name', 'sku', 'unit', 'description', 'providerCode', 'purchasePrice', 'salePrice', 'minStock']
      if (code === 'DUPLICATE_SKU') {
        setError('sku', {
          type: 'server',
          message: `${getErrorMessage(err)}. Usa otro código.`,
        })
      } else if (code === 'DUPLICATE_PROVIDER_CODE_FOR_SUPPLIER') {
        // El BE ya nombra el producto existente; sumamos la acción a seguir.
        setError('providerCode', {
          type: 'server',
          message: `${getErrorMessage(err)}. Cámbialo o edita el producto existente.`,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
      <div className="flex w-full max-w-xl flex-col rounded-2xl bg-white shadow-xl max-h-[92vh]">

        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 px-5 py-4">
          <h3 className="text-base font-semibold text-gray-900">
            {isEdit ? 'Editar producto' : 'Nuevo producto'}
          </h3>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowTutorial(true)}
              title="Ver tutorial: cómo agregar un producto"
              className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
            >
              <HelpCircle size={18} />
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body — scrollable */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex min-h-0 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">

            {/* Nombre + Unidad + Presentación */}
            <div data-tutorial-target="name-unit" className="grid grid-cols-2 gap-3">
              <Field label="Nombre" required error={errors.name?.message}>
                <input {...register('name')} placeholder="Ej. Aceite 5W30" className={inputCls} />
              </Field>
              <Field label="Unidad" error={errors.unit?.message}>
                <select {...register('unit')} className={inputCls}>
                  <option value="unidad">unidad</option>
                  <option value="metro">metro</option>
                  <option value="kilo">kilo</option>
                  <option value="litro">litro</option>
                  <option value="otro">otro...</option>
                </select>
                {unitValue === 'otro' && (
                  <input
                    {...register('unitCustom')}
                    placeholder="Especificá la unidad (ej. galón, par)"
                    className={`${inputCls} mt-1.5`}
                  />
                )}
              </Field>
            </div>

            {/* Código del producto (SKU) */}
            <Field label="Código del producto" error={errors.sku?.message}>
              <input
                {...register('sku')}
                placeholder={isEdit ? 'Código del producto' : 'Se genera automáticamente si lo dejas vacío'}
                className={`${inputCls} font-mono ${
                  errors.sku ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : ''
                }`}
                autoComplete="off"
                spellCheck={false}
              />
              <p className="text-xs text-gray-400 mt-0.5">
                {isEdit
                  ? 'Código interno único. Cámbialo solo si necesitas corregirlo.'
                  : 'Opcional · Si lo dejas vacío, seguimos tu numeración automáticamente.'}
              </p>
            </Field>

            <Field label="Presentación" error={errors.presentation?.message}>
              <input
                {...register('presentation')}
                placeholder="Ej: Saco de 25kg, Caja de 100, Rollo de 50m"
                className={inputCls}
              />
              <p className="text-xs text-gray-400 mt-0.5">
                Opcional · Cómo viene presentado el producto. No afecta cómo se vende.
              </p>
            </Field>

            {/* Brand picker */}
            <div data-tutorial-target="brand-picker">
              <EntityPicker
                label="Marca"
                items={brands}
                value={brandId}
                onChange={setBrandId}
                onCreate={handleCreateBrand}
                placeholder="Buscar marca..."
                createLabel="Nueva marca"
                isCreating={createBrand.isPending}
              />
            </div>

            {/* Supplier picker — obligatorio */}
            <div data-tutorial-target="supplier-picker">
              <EntityPicker
                label={<>Proveedor <span className="text-red-500">*</span></>}
                items={suppliers}
                value={supplierId}
                onChange={(v) => { setSupplierId(v); setSupplierError(null) }}
                onCreate={handleCreateSupplier}
                extraFields={[
                  { name: 'contact', placeholder: 'Contacto (opcional)' },
                  { name: 'phone',   placeholder: 'Teléfono (opcional)'  },
                ]}
                placeholder="Buscar proveedor..."
                createLabel="Nuevo proveedor"
                isCreating={createSupplier.isPending}
              />
              {supplierError && (
                <p className="mt-1 text-xs text-red-500">{supplierError}</p>
              )}
              {/* Pista cuando el producto está vinculado al placeholder */}
              {isEdit && suppliers.find((s) => s.id === supplierId)?.placeholderForUnassigned && (
                <p className="mt-1 text-xs text-amber-700">
                  Este producto está sin proveedor real asignado. Cambialo al proveedor correspondiente.
                </p>
              )}
            </div>

            {/* Category picker */}
            <div data-tutorial-target="category-picker">
              <EntityPicker
                label="Categoría del producto"
                helperText="Ej: Clavos, Tornillos, Cemento, Pinturas"
                items={categories}
                value={categoryId}
                onChange={setCategoryId}
                onCreate={handleCreateCategory}
                placeholder="Buscar categoría..."
                createLabel="Nueva categoría"
                createButtonLabel="Crear categoría"
                newNamePlaceholder="Nombre de la nueva categoría (ej: Líquidos, Pinturas)"
                warnIfLikely={warnIfLooksLikeSupplierOrBrand(suppliers, brands)}
                isCreating={createCategory.isPending}
              />
            </div>

            {/* Código proveedor */}
            <Field label="Código proveedor" error={errors.providerCode?.message}>
              <div className="flex gap-1.5">
                <input
                  {...register('providerCode')}
                  placeholder="Código externo (opcional)"
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm text-gray-900 outline-none transition placeholder-gray-400 ${
                    errors.providerCode
                      ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                      : 'border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'
                  }`}
                />
                {hasCameraSupport && (
                  <button
                    type="button"
                    onClick={cameraOpen ? stopCamera : openCamera}
                    title={cameraOpen ? 'Cerrar cámara' : 'Escanear'}
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

            {/* Descripción */}
            <Field label="Descripción" error={errors.description?.message}>
              <textarea
                {...register('description')}
                rows={2}
                placeholder="Descripción opcional"
                className={`${inputCls} resize-none`}
              />
            </Field>

            {/* Atributos */}
            <div data-tutorial-target="attributes" className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Atributos</label>

              {/* Suggested attribute chips */}
              {suggestedAttrs.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {suggestedAttrs.map((attr) => (
                    <button
                      key={attr}
                      type="button"
                      onClick={() => applySuggestedAttr(attr)}
                      disabled={attr in attributes}
                      className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                        attr in attributes
                          ? 'bg-blue-100 text-blue-700 cursor-default'
                          : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                      }`}
                    >
                      {!(attr in attributes) && <Plus size={10} />}
                      {attr}
                    </button>
                  ))}
                </div>
              )}

              {/* Existing attributes */}
              {Object.keys(attributes).length > 0 && (
                <div className="space-y-1.5">
                  {Object.entries(attributes).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-1.5">
                      <span className="w-28 shrink-0 text-xs font-medium text-gray-500 truncate">{key}</span>
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => setAttributes((prev) => ({ ...prev, [key]: e.target.value }))}
                        placeholder="Valor..."
                        className={`${inputCls} flex-1 py-1.5 text-xs`}
                      />
                      <button type="button" onClick={() => removeAttribute(key)}
                        className="flex-shrink-0 rounded-lg p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add custom attribute */}
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={attrKey}
                  onChange={(e) => setAttrKey(e.target.value)}
                  placeholder="Atributo..."
                  className={`${inputCls} w-28 py-1.5 text-xs`}
                />
                <input
                  type="text"
                  value={attrVal}
                  onChange={(e) => setAttrVal(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAttribute() } }}
                  placeholder="Valor..."
                  className={`${inputCls} flex-1 py-1.5 text-xs`}
                />
                <button type="button" onClick={() => addAttribute()}
                  disabled={!attrKey.trim()}
                  className="flex items-center rounded-lg border border-gray-200 px-2.5 py-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Checkbox precio variable */}
            <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-gray-200 px-3 py-2 hover:bg-gray-50">
              <input
                type="checkbox"
                {...register('priceIsVariable')}
                className="mt-0.5 accent-blue-600"
              />
              <div>
                <p className="text-sm font-semibold text-gray-900">Precio variable</p>
                <p className="text-xs text-gray-500">
                  El precio se define al momento de vender (se negocia con el cliente).
                  En el POS pedirá un precio obligatorio antes de cobrar.
                </p>
              </div>
            </label>

            {/* Precios + Stock mínimo */}
            <div data-tutorial-target="prices">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-gray-700">Precios y stock</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-gray-400">Formato del precio</span>
                  <PriceInputModeToggle />
                </div>
              </div>
              {/* 1 columna en móvil, 2 en adelante: el modo "6 decimales" del
                  PriceInput (dos casillas + punto) necesita ancho — con 3
                  columnas fijas se rompía el layout. Con 2 columnas los
                  precios quedan en una fila y los stocks en la siguiente. */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Controller
                control={control}
                name="purchasePrice"
                render={({ field }) => (
                  <PriceInput
                    label={<>P. compra <span className="text-red-500">*</span></>}
                    value={field.value === '' ? null : field.value}
                    onChange={(v) => field.onChange(v ?? '')}
                    error={errors.purchasePrice?.message}
                  />
                )}
              />
              <Controller
                control={control}
                name="salePrice"
                render={({ field }) => (
                  <PriceInput
                    label={priceIsVariable
                      ? <span className="text-gray-400">P. venta (variable)</span>
                      : <>P. venta <span className="text-red-500">*</span></>}
                    value={priceIsVariable ? null : (field.value === '' ? null : field.value)}
                    onChange={(v) => field.onChange(v ?? '')}
                    error={errors.salePrice?.message}
                    disabled={priceIsVariable}
                  />
                )}
              />
              <Field label="Stock mín." required error={errors.minStock?.message}>
                <input {...register('minStock')} type="number" step={unitValue === 'unidad' ? '1' : '0.001'} min="0" placeholder="0" className={inputCls} />
              </Field>
              {!isEdit && (
                <Field label="Stock inicial" error={errors.initialStock?.message}>
                  <input {...register('initialStock')} type="number" step={unitValue === 'unidad' ? '1' : '0.001'} min="0" placeholder="0" className={inputCls} />
                </Field>
              )}
              </div>
            </div>

            {mutation.isError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {getErrorMessage(mutation.error)}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="flex flex-shrink-0 justify-end gap-2 border-t border-gray-200 px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isBusy}
              data-tutorial-target="save-button"
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {isBusy && <Loader2 size={14} className="animate-spin" />}
              {isBusy ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>

      {showTutorial && <ProductFormTutorial onClose={() => setShowTutorial(false)} />}
    </div>
  )
}
