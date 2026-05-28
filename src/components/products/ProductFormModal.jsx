import { useEffect, useRef, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2, Camera, CameraOff, Plus, FolderOpen } from 'lucide-react'
import { useCreateProduct, useUpdateProduct } from '../../hooks/useProducts'
import { useSuppliers, useCreateSupplier } from '../../hooks/useSuppliers'
import { useBrands, useCreateBrand } from '../../hooks/useBrands'
import { useCategories, useCreateCategory, useSuggestedAttributes } from '../../hooks/useCategories'
import { useAuth } from '../../context/AuthContext'
import EntityPicker from '../ui/EntityPicker'
import MoneyInput from '../ui/MoneyInput'
import { getErrorMessage, getErrorField } from '../../utils/handleApiError'

const schema = z.object({
  name:          z.string().min(2, 'Mínimo 2 caracteres'),
  unit:          z.string().min(1, 'Requerido'),
  description:   z.string().optional(),
  providerCode:  z.string().optional(),
  purchasePrice: z.coerce.number({ invalid_type_error: 'Ingresa un número' }).positive('Debe ser mayor a 0'),
  salePrice:     z.coerce.number({ invalid_type_error: 'Ingresa un número' }).positive('Debe ser mayor a 0'),
  minStock:      z.coerce.number({ invalid_type_error: 'Ingresa un número' }).int().min(0, 'Mínimo 0'),
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

export default function ProductFormModal({ product, onClose }) {
  const isEdit = !!product
  const { user } = useAuth()
  const create   = useCreateProduct()
  const update   = useUpdateProduct()
  const mutation = isEdit ? update : create
  const isBusy   = mutation.isPending

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

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: isEdit
      ? {
          name:          product.name          ?? '',
          unit:          product.unit          ?? '',
          description:   product.description   ?? '',
          providerCode:  product.providerCode  ?? '',
          purchasePrice: product.purchasePrice ?? '',
          salePrice:     product.salePrice     ?? '',
          minStock:      product.minStock      ?? 0,
        }
      : { minStock: 0 },
  })

  useEffect(() => {
    if (isEdit) {
      reset({
        name:          product.name          ?? '',
        unit:          product.unit          ?? '',
        description:   product.description   ?? '',
        providerCode:  product.providerCode  ?? '',
        purchasePrice: product.purchasePrice ?? '',
        salePrice:     product.salePrice     ?? '',
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

  const onSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        supplierId:  supplierId  || null,
        brandId:     brandId     || null,
        categoryId:  categoryId  || null,
        attributes:  Object.keys(attributes).length > 0 ? attributes : null,
      }

      if (isEdit) {
        await update.mutateAsync({
          id: product.id,
          data: {
            ...payload,
            clearSupplierId:  !supplierId,
            clearBrandId:     !brandId,
            clearCategoryId:  !categoryId,
          },
        })
      } else {
        const finalPayload = user.role === 'SUPER_ADMIN'
          ? { ...payload, businessId: user.businessId }
          : payload
        await create.mutateAsync(finalPayload)
      }
      onClose()
    } catch (err) {
      const field = getErrorField(err)
      const known = ['name', 'unit', 'description', 'providerCode', 'purchasePrice', 'salePrice', 'minStock']
      if (field && known.includes(field)) {
        setError(field, { type: 'server', message: getErrorMessage(err) })
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
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body — scrollable */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex min-h-0 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">

            {/* Nombre + Unidad */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nombre" required error={errors.name?.message}>
                <input {...register('name')} placeholder="Ej. Aceite 5W30" className={inputCls} />
              </Field>
              <Field label="Unidad" required error={errors.unit?.message}>
                <input {...register('unit')} placeholder="litros, kg, unid." className={inputCls} />
              </Field>
            </div>

            {/* Brand picker */}
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

            {/* Supplier picker */}
            <EntityPicker
              label="Proveedor"
              items={suppliers}
              value={supplierId}
              onChange={setSupplierId}
              onCreate={handleCreateSupplier}
              extraFields={[
                { name: 'contact', placeholder: 'Contacto (opcional)' },
                { name: 'phone',   placeholder: 'Teléfono (opcional)'  },
              ]}
              placeholder="Buscar proveedor..."
              createLabel="Nuevo proveedor"
              isCreating={createSupplier.isPending}
            />

            {/* Category picker */}
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

            {/* Código proveedor */}
            <Field label="Código proveedor" error={errors.providerCode?.message}>
              <div className="flex gap-1.5">
                <input
                  {...register('providerCode')}
                  placeholder="Código externo (opcional)"
                  className={`${inputCls} flex-1`}
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
            <div className="flex flex-col gap-2">
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

            {/* Precios + Stock mínimo
                Los precios usan MoneyInput: el usuario tipea sólo dígitos
                (ej. "1150") y el masking lo muestra como "11.50". El stock
                es entero, va con <input type="number"> normal. */}
            <div className="grid grid-cols-3 gap-3">
              <Field label="P. compra" required error={errors.purchasePrice?.message}>
                <Controller
                  control={control}
                  name="purchasePrice"
                  render={({ field }) => (
                    <MoneyInput
                      name={field.name}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      className={inputCls}
                    />
                  )}
                />
              </Field>
              <Field label="P. venta" required error={errors.salePrice?.message}>
                <Controller
                  control={control}
                  name="salePrice"
                  render={({ field }) => (
                    <MoneyInput
                      name={field.name}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      className={inputCls}
                    />
                  )}
                />
              </Field>
              <Field label="Stock mín." required error={errors.minStock?.message}>
                <input {...register('minStock')} type="number" step="1" min="0" placeholder="0" className={inputCls} />
              </Field>
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
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {isBusy && <Loader2 size={14} className="animate-spin" />}
              {isBusy ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
