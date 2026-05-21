import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2, Camera, CameraOff } from 'lucide-react'
import { useCreateProduct, useUpdateProduct } from '../../hooks/useProducts'
import { useSuppliers } from '../../hooks/useSuppliers'
import { useBrands } from '../../hooks/useBrands'
import { useAuth } from '../../context/AuthContext'

const schema = z.object({
  name:         z.string().min(2, 'Mínimo 2 caracteres'),
  unit:         z.string().min(1, 'Requerido'),
  description:  z.string().optional(),
  supplierId:   z.string().optional(),
  brandId:      z.string().optional(),
  providerCode: z.string().optional(),
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
  'rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 placeholder-gray-400'

const selectCls =
  'rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 bg-white w-full'

export default function ProductFormModal({ product, onClose }) {
  const isEdit = !!product
  const { user } = useAuth()
  const create = useCreateProduct()
  const update = useUpdateProduct()
  const mutation = isEdit ? update : create
  const isBusy = mutation.isPending

  // Load suppliers and brands for selects
  const { data: suppliersData } = useSuppliers({ size: 200 })
  const { data: brandsData }    = useBrands({ size: 200 })
  const suppliers = suppliersData?.content ?? []
  const brands    = brandsData?.content    ?? []

  // Camera state for scanning providerCode
  const [hasCameraSupport, setHasCameraSupport] = useState(false)
  const [cameraOpen, setCameraOpen]             = useState(false)
  const videoRef        = useRef(null)
  const streamRef       = useRef(null)
  const detectorRef     = useRef(null)
  const scanIntervalRef = useRef(null)

  useEffect(() => {
    setHasCameraSupport(!!navigator.mediaDevices?.getUserMedia)
  }, [])

  useEffect(() => {
    return () => stopCamera()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
    // ZXing reader has reset(); native BarcodeDetector does not — optional chaining handles both
    detectorRef.current?.reset?.()
    detectorRef.current = null
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraOpen(false)
  }

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      streamRef.current = stream
      videoRef.current.srcObject = stream
      await videoRef.current.play()
      setCameraOpen(true)

      if (typeof window.BarcodeDetector !== 'undefined') {
        // Native BarcodeDetector (Chrome / Edge)
        const detector = new window.BarcodeDetector({
          formats: ['qr_code', 'code_128', 'ean_13', 'ean_8', 'code_39', 'upc_a', 'upc_e'],
        })
        detectorRef.current = detector

        scanIntervalRef.current = setInterval(async () => {
          if (!videoRef.current || !detectorRef.current) return
          try {
            const barcodes = await detector.detect(videoRef.current)
            if (barcodes.length > 0) {
              stopCamera()
              setValue('providerCode', barcodes[0].rawValue)
            }
          } catch {
            // frame not ready yet
          }
        }, 500)
      } else {
        // @zxing/browser fallback (Safari, Firefox, all others)
        const { BrowserMultiFormatReader } = await import('@zxing/browser')
        const reader = new BrowserMultiFormatReader()
        detectorRef.current = reader

        reader.decodeFromVideoElement(videoRef.current, (result) => {
          if (result) {
            stopCamera()
            setValue('providerCode', result.getText())
          }
        })
      }
    } catch {
      // Permission denied or device unavailable — fail silently
    }
  }

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: isEdit
      ? {
          name:          product.name ?? '',
          unit:          product.unit ?? '',
          description:   product.description ?? '',
          supplierId:    product.supplierId ?? '',
          brandId:       product.brandId ?? '',
          providerCode:  product.providerCode ?? '',
          purchasePrice: product.purchasePrice ?? '',
          salePrice:     product.salePrice ?? '',
          minStock:      product.minStock ?? 0,
        }
      : { minStock: 0, supplierId: '', brandId: '' },
  })

  useEffect(() => {
    if (isEdit) {
      reset({
        name:          product.name ?? '',
        unit:          product.unit ?? '',
        description:   product.description ?? '',
        supplierId:    product.supplierId ?? '',
        brandId:       product.brandId ?? '',
        providerCode:  product.providerCode ?? '',
        purchasePrice: product.purchasePrice ?? '',
        salePrice:     product.salePrice ?? '',
        minStock:      product.minStock ?? 0,
      })
    }
  }, [product?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        supplierId:    values.supplierId    || null,
        brandId:       values.brandId       || null,
        clearSupplierId: isEdit && !values.supplierId,
        clearBrandId:    isEdit && !values.brandId,
      }

      if (isEdit) {
        await update.mutateAsync({ id: product.id, data: payload })
      } else {
        const finalPayload = user.role === 'SUPER_ADMIN'
          ? { ...payload, businessId: user.businessId }
          : payload
        await create.mutateAsync(finalPayload)
      }
      onClose()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
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

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-4 px-6 py-5">
            {/* Row 1 — 2 columns */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <Field label="Nombre" required error={errors.name?.message}>
                  <input {...register('name')} placeholder="Ej. Aceite motor 5W30" className={inputCls} />
                </Field>
                <Field label="Unidad" required error={errors.unit?.message}>
                  <input {...register('unit')} placeholder="Ej. litros, unidades, kg" className={inputCls} />
                </Field>
              </div>

              <div className="space-y-4">
                {/* Marca — select */}
                <Field label="Marca" error={errors.brandId?.message}>
                  <select {...register('brandId')} className={selectCls}>
                    <option value="">— Sin marca —</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </Field>

                {/* Proveedor — select */}
                <Field label="Proveedor" error={errors.supplierId?.message}>
                  <select {...register('supplierId')} className={selectCls}>
                    <option value="">— Sin proveedor —</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Código proveedor" error={errors.providerCode?.message}>
                  <div className="flex gap-1.5">
                    <input
                      {...register('providerCode')}
                      placeholder="Código externo"
                      className={`${inputCls} flex-1`}
                    />
                    {hasCameraSupport && (
                      <button
                        type="button"
                        onClick={cameraOpen ? stopCamera : openCamera}
                        title={cameraOpen ? 'Cerrar cámara' : 'Escanear con cámara'}
                        className={`flex items-center rounded-lg px-2.5 transition ${
                          cameraOpen
                            ? 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                            : 'border border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {cameraOpen ? <CameraOff size={15} /> : <Camera size={15} />}
                      </button>
                    )}
                  </div>
                  {hasCameraSupport && (
                    <div className={cameraOpen ? 'mt-1.5 block' : 'hidden'}>
                      <div className="relative overflow-hidden rounded-lg border border-orange-200 bg-black">
                        <video
                          ref={videoRef}
                          className="w-full"
                          style={{ maxHeight: 160 }}
                          playsInline
                          muted
                        />
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                          <div className="h-16 w-36 rounded border-2 border-orange-400 opacity-80" />
                        </div>
                      </div>
                    </div>
                  )}
                </Field>
              </div>
            </div>

            {/* Descripción */}
            <Field label="Descripción" error={errors.description?.message}>
              <textarea
                {...register('description')}
                rows={2}
                placeholder="Descripción opcional del producto"
                className={`${inputCls} resize-none`}
              />
            </Field>

            {/* Prices row */}
            <div className="grid grid-cols-3 gap-4">
              <Field label="Precio compra" required error={errors.purchasePrice?.message}>
                <input {...register('purchasePrice')} type="number" step="0.01" min="0" placeholder="0.00" className={inputCls} />
              </Field>
              <Field label="Precio venta" required error={errors.salePrice?.message}>
                <input {...register('salePrice')} type="number" step="0.01" min="0" placeholder="0.00" className={inputCls} />
              </Field>
              <Field label="Stock mínimo" required error={errors.minStock?.message}>
                <input {...register('minStock')} type="number" step="1" min="0" placeholder="0" className={inputCls} />
              </Field>
            </div>

            {mutation.isError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {mutation.error?.response?.data?.message ?? 'Error al guardar el producto'}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4">
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
              className="flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
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
