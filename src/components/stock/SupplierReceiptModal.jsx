import { useEffect, useMemo, useRef, useState } from 'react'
import {
  X, Loader2, Trash2, Truck, AlertTriangle, PackagePlus,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../../context/AuthContext'
import { useSuppliers } from '../../hooks/useSuppliers'
import { useProducts, useCreateProduct } from '../../hooks/useProducts'
import { useDebounce } from '../../hooks/useDebounce'
import { useCreateSupplierReceipt } from '../../hooks/useSupplierReceipts'
import { productsApi } from '../../services/endpoints/products'
import ScannerInput from '../ScannerInput'
import PriceInput from '../inputs/PriceInput'
import QuantityInput from '../inputs/QuantityInput'
import { formatPrice } from '../../utils/formatMoney'
import { formatQty, isDivisibleUnit } from '../../utils/quantity'
import { getErrorMessage } from '../../utils/handleApiError'

/**
 * Modal de recepción de mercadería — flujo en 2 pasos:
 *   1. Elegir proveedor (obligatorio antes que cualquier otra cosa).
 *   2. Cargar productos: el picker busca en TODO el catálogo. Un producto
 *      habitual de OTRO proveedor entra igual (el BE crea/reusa la versión de
 *      este proveedor al registrar) y si no existe se crea inline. Cada línea
 *      pide cantidad y precio unitario (default product.purchasePrice, editable).
 *
 * El total se calcula sum(qty × unitCost) y queda editable arriba para
 * permitir registrar el monto real de la factura (puede diferir por
 * descuentos, gastos extra, etc.).
 *
 * `initialSupplier` ({id, name}) e `initialProduct` (producto completo):
 * prefijan paso 1 y 2 — los usa el detalle de producto en Stock para que
 * "Registrar entrada" llegue con proveedor elegido y el producto ya en el
 * carrito; el usuario puede sumar más productos del mismo proveedor.
 */
export default function SupplierReceiptModal({ onClose, initialSupplier = null, initialProduct = null }) {
  const createReceipt = useCreateSupplierReceipt()
  const createProduct = useCreateProduct()

  // ── Borrador persistente (caso William: factura con productos nuevos) ────
  // El carrito se guarda solo en localStorage mientras se arma: cerrar el
  // modal (para crear productos en Productos con calma, o por accidente) NO
  // pierde nada — al reabrir la recepción sigue donde quedó. Se limpia al
  // registrar o con «Empezar de cero». Si llega initialProduct/initialSupplier
  // (flujo «Registrar entrada» del detalle) esa intención explícita gana.
  const { user } = useAuth()
  const draftKey = `eazystock_receipt_draft_${user?.businessId ?? 'global'}`
  const draftRef = useRef(undefined)
  if (draftRef.current === undefined) {
    let d = null
    if (!initialProduct && !initialSupplier) {
      try { d = JSON.parse(localStorage.getItem(draftKey)) } catch { d = null }
    }
    draftRef.current = d
  }
  const draft = draftRef.current
  const [restoredBanner, setRestoredBanner] = useState(!!draft?.items?.length)

  // ── Alta inline: el producto no existe → nace acá, ya de este proveedor ──
  const [quickForm, setQuickForm] = useState(null) // {name, unit, salePrice} | null

  // ── Paso 1: proveedor ────────────────────────────────────────────────────
  const [supplier, setSupplier]                 = useState(initialSupplier ?? draft?.supplier ?? null)
  const [supplierQuery, setSupplierQuery]       = useState('')
  const [showSupplierDrop, setShowSupplierDrop] = useState(false)
  const debouncedSupplier = useDebounce(supplierQuery, 350)
  const { data: suppliersData } = useSuppliers(
    { search: debouncedSupplier || undefined, size: 8 },
    { enabled: !supplier },
  )
  const supplierResults = suppliersData?.content ?? []

  // ── Paso 2: productos (filtrados por proveedor) ──────────────────────────
  const [productQuery, setProductQuery]           = useState('')
  const [showProductDrop, setShowProductDrop]     = useState(false)
  const scanLockRef = useRef(false)
  const debouncedProduct = useDebounce(productQuery, 350)
  // Busca en TODOS los productos (no solo los del proveedor elegido): si William
  // le compra a un proveedor nuevo un producto que ya vende, lo encuentra igual
  // y el BE crea la versión de este proveedor al registrar.
  //
  // Scroll infinito: páginas de 30 acumuladas por número de página DEL SERVER
  // (productsData.number) — el placeholderData del hook re-entrega la página
  // anterior mientras carga la nueva, y keyear por productPage la duplicaría.
  const PRODUCT_PAGE_SIZE = 30
  const [productPage, setProductPage] = useState(0)
  const [productPagesMap, setProductPagesMap] = useState({})
  useEffect(() => { setProductPage(0); setProductPagesMap({}) }, [debouncedProduct])
  const { data: productsData, isLoading: loadingProducts, isFetching: fetchingProducts } = useProducts(
    supplier && debouncedProduct
      ? { search: debouncedProduct, size: PRODUCT_PAGE_SIZE, page: productPage, active: true }
      : null,
    { enabled: !!supplier && !!debouncedProduct },
  )
  useEffect(() => {
    if (productsData?.content) {
      setProductPagesMap((prev) => ({ ...prev, [productsData.number ?? 0]: productsData.content }))
    }
  }, [productsData])
  const productResults = Object.keys(productPagesMap)
    .sort((a, b) => a - b)
    .flatMap((k) => productPagesMap[k])
  const totalProductResults = productsData?.totalElements ?? 0
  const hasMoreProducts = productResults.length > 0 && productResults.length < totalProductResults

  // Centinela al pie del dropdown: al verse, carga la página siguiente.
  // Los refs evitan closures viejos dentro del IntersectionObserver.
  const productSentinelRef = useRef(null)
  const fetchingProductsRef = useRef(false)
  useEffect(() => { fetchingProductsRef.current = fetchingProducts }, [fetchingProducts])
  const lastPageRef = useRef(true)
  useEffect(() => { lastPageRef.current = productsData?.last ?? true }, [productsData])
  useEffect(() => {
    const el = productSentinelRef.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !fetchingProductsRef.current && !lastPageRef.current) {
        setProductPage((p) => p + 1)
      }
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [showProductDrop, debouncedProduct, productResults.length])
  const isForeign = (p) => p?.supplierId && supplier && p.supplierId !== supplier.id

  // ── Carrito ──────────────────────────────────────────────────────────────
  // item shape: { product, quantity, unitCost }
  const [items, setItems] = useState(() => (
    initialProduct && initialSupplier
      ? [{ product: initialProduct, quantity: 1, unitCost: Number(initialProduct.purchasePrice ?? 0) }]
      : (draft?.items ?? [])
  ))
  const itemsRef = useRef([])
  useEffect(() => { itemsRef.current = items }, [items])

  // Si el OWNER cambia de proveedor, vaciamos el carrito (productos eran del
  // otro). El ref evita vaciar el carrito inicial en el primer render.
  const prevSupplierIdRef = useRef(supplier?.id)
  useEffect(() => {
    if (prevSupplierIdRef.current === supplier?.id) return
    prevSupplierIdRef.current = supplier?.id
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems([]); setProductQuery('')
  }, [supplier?.id])

  // ── Receipt header ───────────────────────────────────────────────────────
  const [paymentMode, setPaymentMode]               = useState(draft?.paymentMode ?? 'CASH')
  const [totalAmount, setTotalAmount]               = useState(draft?.totalAmount ?? null)
  const [totalTouched, setTotalTouched]             = useState(draft?.totalTouched ?? false)
  const [referenceDocument, setReferenceDocument]   = useState(draft?.referenceDocument ?? '')
  const [notes, setNotes]                           = useState(draft?.notes ?? '')
  const [error, setError]                           = useState(null)

  // Autosave del borrador en cada cambio; sin contenido, se limpia solo.
  useEffect(() => {
    try {
      if (!supplier && items.length === 0 && !referenceDocument && !notes) {
        localStorage.removeItem(draftKey)
      } else {
        localStorage.setItem(draftKey, JSON.stringify({
          supplier, items, paymentMode, totalAmount, totalTouched, referenceDocument, notes,
        }))
      }
    } catch { /* localStorage lleno o bloqueado: el borrador es best-effort */ }
  }, [supplier, items, paymentMode, totalAmount, totalTouched, referenceDocument, notes, draftKey])

  const startFresh = () => {
    setSupplier(null); setItems([]); setPaymentMode('CASH'); setTotalAmount(null)
    setTotalTouched(false); setReferenceDocument(''); setNotes(''); setRestoredBanner(false)
    try { localStorage.removeItem(draftKey) } catch {}
  }

  const computedTotal = useMemo(() => items.reduce(
    (sum, it) => sum + (Number(it.unitCost ?? 0) * (Number(it.quantity) || 0)),
    0,
  ), [items])

  // Mientras el OWNER no toque el campo de total, mantenemos auto-sync con la
  // suma de líneas. Una vez que tocó el campo, respeta lo que ingresó.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!totalTouched) setTotalAmount(computedTotal > 0 ? computedTotal : null)
  }, [computedTotal, totalTouched])

  const finalTotal = totalAmount != null ? totalAmount : computedTotal

  // ── Cart actions ─────────────────────────────────────────────────────────
  // En compras largas la línea recién tocada quedaba lejos del buscador y
  // había que deslizar hasta encontrarla para cambiar cantidad/precio
  // (feedback de William) → la línea se trae a la vista sola, destella, y si
  // el alta fue por click el cursor cae en la cantidad ya seleccionada.
  const lineRefs = useRef({})
  const qtyRefs  = useRef({})
  const [flashId, setFlashId] = useState(null)
  const flashTimerRef = useRef(null)
  useEffect(() => () => clearTimeout(flashTimerRef.current), [])

  const spotlightLine = (id, { focusQty = false } = {}) => {
    // Doble rAF: la línea nueva recién existe en el DOM tras el re-render.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      lineRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      // Con el escáner NO se roba el foco (rompería el escaneo en cadena).
      if (focusQty) qtyRefs.current[id]?.focus()
      setFlashId(id)
      clearTimeout(flashTimerRef.current)
      flashTimerRef.current = setTimeout(() => setFlashId(null), 1600)
    }))
  }

  const addProduct = (p, { focusQty = false } = {}) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === p.id)
      if (existing) {
        return prev.map((i) => i.product.id === p.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      // Default unitCost del purchasePrice del producto, editable por línea.
      // La línea nueva entra ARRIBA: queda pegada al buscador, no al fondo.
      return [{
        product: p,
        quantity: 1,
        unitCost: Number(p.purchasePrice ?? 0),
      }, ...prev]
    })
    setProductQuery('')
    setShowProductDrop(false)
    spotlightLine(p.id, { focusQty })
  }
  // Cantidad escribible directa (incl. decimales para productos divisibles).
  const changeQty = (id, value) => setItems((prev) =>
    prev.map((i) => i.product.id === id ? { ...i, quantity: value } : i))
  // Al re-escanear un producto ya agregado: suma 1.
  const bumpQty = (id) => setItems((prev) =>
    prev.map((i) => i.product.id === id ? { ...i, quantity: (Number(i.quantity) || 0) + 1 } : i))
  const changeUnitCost = (id, value) => setItems((prev) =>
    prev.map((i) => i.product.id === id ? { ...i, unitCost: value } : i))
  // Venta editable desde la recepción: el costo subió → el OWNER decide su
  // margen ahí mismo. Cerrar el editor descarta el cambio (venta queda como está).
  const toggleSale = (id) => setItems((prev) =>
    prev.map((i) => i.product.id === id
      ? { ...i, saleOpen: !i.saleOpen, ...(i.saleOpen ? { salePrice: null } : {}) }
      : i))
  const changeSalePrice = (id, value) => setItems((prev) =>
    prev.map((i) => i.product.id === id ? { ...i, salePrice: value } : i))
  const effSale = (i) => i.salePrice != null ? Number(i.salePrice) : Number(i.product.salePrice ?? 0)
  const marginOf = (i) => effSale(i) - Number(i.unitCost ?? 0)
  const removeItem = (id) => setItems((prev) => prev.filter((i) => i.product.id !== id))

  // Cerrar con carrito != perderlo: avisamos que el borrador queda guardado.
  const handleClose = () => {
    if (itemsRef.current.length > 0) {
      toast.info('Recepción guardada como borrador — al volver a «Registrar recepción» seguirá aquí')
    }
    onClose()
  }

  const handleScan = async (code) => {
    if (!supplier) { toast.warning('Elegí primero el proveedor'); return }
    if (scanLockRef.current) return
    scanLockRef.current = true
    try {
      const product = (await productsApi.scanCode(code)).data.data
      if (!product) { toast.error('Producto no encontrado'); return }
      if (itemsRef.current.some((i) => i.product.id === product.id)) {
        bumpQty(product.id)
        spotlightLine(product.id)
        toast.info('Cantidad actualizada')
        return
      }
      addProduct(product)
      if (isForeign(product)) {
        toast.info(`${product.name} es habitual de ${product.supplierName ?? 'otro proveedor'} — se creará la versión de ${supplier.name}`)
      } else {
        toast.success(product.name)
      }
    } catch {
      toast.error('Producto no encontrado')
    } finally {
      scanLockRef.current = false
    }
  }

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!supplier) { setError('Seleccioná el proveedor'); return }
    if (items.length === 0) { setError('Agregá al menos un producto'); return }
    const badQty = items.find((i) => {
      const q = Number(i.quantity)
      if (!Number.isFinite(q) || q <= 0) return true
      if (!isDivisibleUnit(i.product.unit) && !Number.isInteger(q)) return true
      return false
    })
    if (badQty) {
      setError(`Revisá la cantidad de "${badQty.product.name}"`)
      return
    }
    if (!finalTotal || finalTotal <= 0) {
      setError('Ingresá el monto total de la compra')
      return
    }

    try {
      await createReceipt.mutateAsync({
        supplierId: supplier.id,
        data: {
          items: items.map((i) => ({
            productId: i.product.id,
            quantity:  i.quantity,
            unitCost:  i.unitCost ?? null,
            salePrice: i.salePrice ?? null,
          })),
          totalAmount:       finalTotal,
          paymentMode,
          referenceDocument: referenceDocument.trim() || null,
          notes:             notes.trim() || null,
        },
      })
      try { localStorage.removeItem(draftKey) } catch {}
      toast.success(
        paymentMode === 'CREDIT'
          ? `Recepción registrada — ${formatPrice(finalTotal)} sumados a la deuda con ${supplier.name}`
          : `Recepción registrada — ${formatPrice(finalTotal)} pagados al contado a ${supplier.name}`,
      )
      onClose()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const inputCls = 'w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'
  const totalItems = items.reduce((s, i) => s + (Number(i.quantity) || 0), 0)

  // Disable step-2 fields hasta que haya proveedor.
  const step2Disabled = !supplier

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
      <div className="flex w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl max-h-[92vh]">

        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <PackagePlus size={20} className="text-emerald-600" />
            <h3 className="text-base font-bold text-gray-900">Nueva recepción</h3>
          </div>
          <button onClick={handleClose} className="rounded-xl p-2 text-gray-400 hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">

            {restoredBanner && (
              <div className="flex items-start justify-between gap-3 rounded-xl bg-blue-50 px-4 py-3 ring-1 ring-blue-100">
                <p className="text-xs leading-relaxed text-blue-700">
                  <span className="font-semibold">Retomaste una recepción guardada.</span>{' '}
                  El carrito se guarda solo: puedes cerrar, crear productos en Productos y volver — nada se pierde.
                </p>
                <button
                  type="button"
                  onClick={startFresh}
                  className="flex-shrink-0 text-xs font-semibold text-blue-700 underline hover:opacity-80"
                >
                  Empezar de cero
                </button>
              </div>
            )}

            {/* ── Paso 1: proveedor ──────────────────────────────────────── */}
            <section>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-900">
                  1. Proveedor <span className="text-red-500">*</span>
                </label>
                {supplier && (
                  <button type="button" onClick={() => setSupplier(null)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                    Cambiar proveedor
                  </button>
                )}
              </div>

              {supplier ? (
                <div className="flex items-center gap-2 rounded-xl border border-blue-300 bg-blue-50 px-3 py-2">
                  <Truck size={16} className="text-blue-600" />
                  <span className="flex-1 text-sm font-semibold text-blue-900">{supplier.name}</span>
                  {supplier.ruc && (
                    <span className="font-mono text-xs text-blue-700">RUC {supplier.ruc}</span>
                  )}
                  {Number(supplier.currentDebt ?? 0) > 0 && (
                    <span className="text-xs font-mono text-red-600">
                      Deuda: {formatPrice(supplier.currentDebt)}
                    </span>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <input
                    value={supplierQuery}
                    onChange={(e) => { setSupplierQuery(e.target.value); setShowSupplierDrop(true) }}
                    onFocus={() => setShowSupplierDrop(true)}
                    placeholder="Buscar proveedor..."
                    className={inputCls}
                  />
                  {showSupplierDrop && (supplierResults.length > 0 || debouncedSupplier) && (
                    <div className="absolute z-20 mt-1 w-full rounded-xl border border-gray-100 bg-white shadow-xl max-h-56 overflow-y-auto">
                      {supplierResults.length === 0 ? (
                        <p className="px-4 py-3 text-sm text-gray-400">Sin resultados</p>
                      ) : (
                        supplierResults.map((s) => (
                          <button key={s.id} type="button"
                            onClick={() => { setSupplier(s); setShowSupplierDrop(false); setSupplierQuery('') }}
                            className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-blue-50 first:rounded-t-xl last:rounded-b-xl">
                            <div>
                              <p className="font-semibold text-gray-900">{s.name}</p>
                              {s.ruc && <p className="font-mono text-xs text-gray-400">RUC {s.ruc}</p>}
                            </div>
                            {Number(s.currentDebt ?? 0) > 0 && (
                              <span className="text-xs font-mono text-red-600">
                                Deuda: {formatPrice(s.currentDebt)}
                              </span>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* ── Paso 2: productos ──────────────────────────────────────── */}
            <section className={step2Disabled ? 'opacity-50 pointer-events-none' : ''}>
              <label className="mb-1.5 block text-sm font-semibold text-gray-900">
                2. Productos recibidos <span className="text-red-500">*</span>
              </label>

              {step2Disabled ? (
                <p className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-500 ring-1 ring-gray-100">
                  Elegí primero el proveedor para continuar.
                </p>
              ) : (
                <>
                  <div className="flex items-start gap-2">
                  <div className="relative flex-1">
                    <ScannerInput
                      value={productQuery}
                      onChange={(v) => { setProductQuery(v); setShowProductDrop(true) }}
                      onScan={handleScan}
                      placeholder={`Buscar productos de ${supplier.name}...`}
                    />
                    {showProductDrop && debouncedProduct && (
                      <div className="absolute z-20 mt-1 w-full rounded-xl border border-gray-100 bg-white shadow-xl max-h-56 overflow-y-auto">
                        {productResults.length === 0 && (loadingProducts || fetchingProducts) ? (
                          <p className="px-4 py-3 text-sm text-gray-400">Buscando...</p>
                        ) : productResults.length === 0 ? (
                          <div className="px-4 py-3 text-sm">
                            <p className="text-gray-500">Sin resultados para "{debouncedProduct}"</p>
                            <button type="button"
                              onClick={() => {
                                setQuickForm({ name: productQuery.trim(), unit: 'unidad', salePrice: null })
                                setShowProductDrop(false)
                              }}
                              className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
                              <PackagePlus size={11} />
                              Crear "{debouncedProduct}" como producto nuevo de {supplier.name}
                            </button>
                          </div>
                        ) : (
                          <>
                            {productResults.map((p) => (
                              <button key={p.id} type="button" onClick={() => addProduct(p, { focusQty: true })}
                                className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-blue-50 first:rounded-t-xl last:rounded-b-xl">
                                <div className="min-w-0">
                                  <p className="truncate font-semibold text-gray-900">{p.name}</p>
                                  <p className="font-mono text-xs text-gray-400">
                                    {p.sku}
                                    {isForeign(p) && (
                                      <span className="ml-2 font-sans font-semibold text-amber-600">
                                        habitual de {p.supplierName ?? 'otro proveedor'}
                                      </span>
                                    )}
                                  </p>
                                </div>
                                <span className="ml-2 flex-shrink-0 text-xs font-mono text-gray-500">
                                  {formatPrice(p.purchasePrice)}
                                </span>
                              </button>
                            ))}
                            {hasMoreProducts && (
                              <div
                                ref={productSentinelRef}
                                className="border-t border-gray-50 px-4 py-2.5 text-center text-xs text-gray-500"
                              >
                                {fetchingProducts
                                  ? 'Cargando más...'
                                  : `${totalProductResults - productResults.length} resultados más — baja para cargarlos o sigue escribiendo para afinar`}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Producto nuevo SIEMPRE a la vista: en la factura real hay
                      productos nuevos entre los recurrentes (caso William) */}
                  <button
                    type="button"
                    onClick={() => {
                      setQuickForm({ name: productQuery.trim(), unit: 'unidad', salePrice: null })
                      setShowProductDrop(false)
                    }}
                    className="flex flex-shrink-0 items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Crear un producto que aún no existe y agregarlo a esta recepción"
                  >
                    <PackagePlus size={14} />
                    Nuevo
                  </button>
                  </div>

                  {/* Alta inline: el producto nace acá, ya de este proveedor */}
                  {quickForm && (
                    <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50/50 p-3">
                      <p className="text-sm font-semibold text-gray-900">
                        Producto nuevo de {supplier.name}
                      </p>
                      <div className="mt-2 space-y-2">
                        <input
                          value={quickForm.name}
                          onChange={(e) => setQuickForm((f) => ({ ...f, name: e.target.value }))}
                          placeholder="Nombre del producto"
                          className={inputCls}
                        />
                        <div className="flex flex-wrap gap-1.5">
                          {['unidad', 'metro', 'kilo', 'litro'].map((u) => (
                            <button key={u} type="button"
                              onClick={() => setQuickForm((f) => ({ ...f, unit: u }))}
                              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                                quickForm.unit === u
                                  ? 'border-blue-500 bg-blue-100 text-blue-700'
                                  : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                              }`}>
                              {u}
                            </button>
                          ))}
                        </div>
                        <PriceInput
                          label="Precio de venta"
                          value={quickForm.salePrice}
                          onChange={(v) => setQuickForm((f) => ({ ...f, salePrice: v }))}
                          maxDecimals={2}
                          helperText="El costo de compra lo escribís en la línea de la recepción"
                        />
                        <div className="flex justify-end gap-2 pt-1">
                          <button type="button" onClick={() => setQuickForm(null)}
                            className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100">
                            Cancelar
                          </button>
                          <button type="button"
                            disabled={!quickForm.name.trim() || quickForm.salePrice == null || createProduct.isPending}
                            onClick={async () => {
                              try {
                                const created = await createProduct.mutateAsync({
                                  name: quickForm.name.trim(),
                                  unit: quickForm.unit,
                                  purchasePrice: 0,
                                  salePrice: quickForm.salePrice,
                                  supplierId: supplier.id,
                                })
                                addProduct(created, { focusQty: true })
                                setQuickForm(null)
                                toast.success(`${created.name} creado — escribí su costo en la línea`)
                              } catch (err) {
                                toast.error(getErrorMessage(err))
                              }
                            }}
                            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                            {createProduct.isPending && <Loader2 size={11} className="animate-spin" />}
                            Crear y agregar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Carrito */}
                  {items.length === 0 ? (
                    <p className="mt-2 text-xs text-gray-400">
                      Buscá productos arriba y se irán cargando acá con su precio de compra editable.
                    </p>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {items.map((it) => (
                        <div
                          key={it.product.id}
                          ref={(el) => { lineRefs.current[it.product.id] = el }}
                          className={`rounded-xl border p-3 transition-all duration-500 ${
                            flashId === it.product.id
                              ? 'border-blue-300 bg-blue-50/70 ring-2 ring-blue-300/60'
                              : 'border-gray-100 bg-gray-50/60 ring-2 ring-transparent'
                          }`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-gray-900">{it.product.name}</p>
                              <p className="font-mono text-[10px] text-gray-400">{it.product.sku}</p>
                            </div>
                            <button type="button" onClick={() => removeItem(it.product.id)}
                              className="flex-shrink-0 rounded-lg p-1.5 text-gray-300 hover:bg-white hover:text-red-500">
                              <Trash2 size={14} />
                            </button>
                          </div>

                          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                            <QuantityInput
                              ref={(el) => { qtyRefs.current[it.product.id] = el }}
                              value={it.quantity}
                              onChange={(v) => changeQty(it.product.id, v)}
                              unit={it.product.unit || 'unidad'}
                              maxDecimals={3}
                            />
                            <PriceInput
                              value={it.unitCost}
                              onChange={(v) => changeUnitCost(it.product.id, v)}
                              maxDecimals={6}
                            />
                            <div className="flex items-center justify-end text-sm font-semibold text-gray-900 sm:justify-end">
                              {formatPrice((Number(it.quantity) || 0) * Number(it.unitCost ?? 0))}
                            </div>
                          </div>
                          {/* Venta y margen EN VIVO con el costo tipeado: si el
                              proveedor subió el precio, acá mismo se decide (y ve)
                              cuánto queda de ganancia — sin ir a Productos. */}
                          {!it.product.priceIsVariable && (
                            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-gray-100 pt-2 text-xs">
                              <span className="text-gray-500">
                                venta <span className="font-semibold text-gray-800">{formatPrice(effSale(it))}</span>
                              </span>
                              <span className={`font-medium ${marginOf(it) > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                margen {formatPrice(marginOf(it))}
                                {effSale(it) > 0 && ` · ${Math.round((marginOf(it) / effSale(it)) * 100)}%`}
                              </span>
                              <button type="button" onClick={() => toggleSale(it.product.id)}
                                className="ml-auto font-semibold text-blue-600 hover:text-blue-700">
                                {it.saleOpen ? 'dejar la venta como está' : 'cambiar la venta'}
                              </button>
                            </div>
                          )}
                          {it.saleOpen && !it.product.priceIsVariable && (
                            <div className="mt-2">
                              <PriceInput
                                label="Nuevo precio de venta"
                                value={it.salePrice ?? Number(it.product.salePrice ?? 0)}
                                onChange={(v) => changeSalePrice(it.product.id, v)}
                                maxDecimals={2}
                              />
                            </div>
                          )}
                          {it.salePrice != null && Number(it.salePrice) !== Number(it.product.salePrice ?? 0) && (
                            <p className="mt-1.5 text-xs text-blue-600">
                              El precio de venta pasará de {formatPrice(it.product.salePrice)} a{' '}
                              <span className="font-semibold">{formatPrice(it.salePrice)}</span>
                            </p>
                          )}
                          {/* Producto habitual de otro proveedor: nace su versión
                              para este proveedor, con su propio código y este costo. */}
                          {isForeign(it.product) && (
                            <p className="mt-1.5 text-xs font-medium text-violet-600">
                              Habitual de {it.product.supplierName ?? 'otro proveedor'} — se creará como
                              producto nuevo de <span className="font-semibold">{supplier?.name}</span> con este costo
                            </p>
                          )}
                          {/* El costo tipeado pasa a ser el precio de compra del producto:
                              decirlo acá, no sorprender después en Productos. */}
                          {!isForeign(it.product) && it.unitCost != null
                            && Number(it.unitCost) !== Number(it.product.purchasePrice ?? 0) && (
                            <p className="mt-1.5 text-xs text-blue-600">
                              El precio de compra pasará de {formatPrice(it.product.purchasePrice)} a{' '}
                              <span className="font-semibold">{formatPrice(it.unitCost)}</span>
                            </p>
                          )}
                          {it.unitCost != null && !it.product.priceIsVariable
                            && effSale(it) > 0 && Number(it.unitCost) >= effSale(it) && (
                            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-amber-600">
                              <AlertTriangle size={11} className="flex-shrink-0" />
                              Este costo iguala o supera el precio de venta ({formatPrice(effSale(it))}) — revisá el margen
                            </p>
                          )}
                        </div>
                      ))}
                      <p className="text-xs text-gray-400">
                        {items.length} producto{items.length !== 1 ? 's' : ''} · {formatQty(totalItems)} ítem{totalItems !== 1 ? 's' : ''}
                      </p>
                    </div>
                  )}
                </>
              )}
            </section>

            {/* ── Forma de pago + total + factura ────────────────────────── */}
            <section className={step2Disabled ? 'opacity-50 pointer-events-none' : ''}>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Forma de pago <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setPaymentMode('CASH')}
                  className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                    paymentMode === 'CASH'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}>
                  Al contado
                </button>
                <button type="button" onClick={() => setPaymentMode('CREDIT')}
                  className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                    paymentMode === 'CREDIT'
                      ? 'border-amber-500 bg-amber-50 text-amber-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}>
                  A crédito (suma deuda)
                </button>
              </div>
            </section>

            <section className={step2Disabled ? 'opacity-50 pointer-events-none' : ''}>
              <PriceInput
                label={<>Monto total de la compra <span className="text-red-500">*</span></>}
                value={totalAmount}
                onChange={(v) => { setTotalAmount(v); setTotalTouched(true) }}
                maxDecimals={2}
                helperText={
                  computedTotal > 0 && totalTouched && Math.abs(computedTotal - (totalAmount ?? 0)) > 0.005
                    ? `Diferencia con la suma de líneas: ${formatPrice(computedTotal)}`
                    : 'Se autocalcula desde las líneas — podés sobrescribirlo si la factura cobró distinto'
                }
              />
            </section>

            <section className={step2Disabled ? 'opacity-50 pointer-events-none' : ''}>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Referencia (factura / guía) {paymentMode === 'CREDIT' && <span className="text-gray-400">(recomendado)</span>}
              </label>
              <input
                value={referenceDocument}
                onChange={(e) => setReferenceDocument(e.target.value)}
                maxLength={100}
                placeholder="Factura 0023-001234"
                className={inputCls}
              />
            </section>

            <section className={step2Disabled ? 'opacity-50 pointer-events-none' : ''}>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Notas (opcional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className={`${inputCls} resize-none`}
              />
            </section>

            {/* Resumen */}
            {supplier && items.length > 0 && finalTotal > 0 && (
              <div className="rounded-xl bg-gray-50 px-4 py-3 text-sm ring-1 ring-gray-100">
                <p className="font-semibold text-gray-800">Resumen</p>
                <p className="mt-1 text-gray-600">
                  {items.length} producto{items.length !== 1 ? 's' : ''} ({totalItems} unidades) de{' '}
                  <span className="font-semibold">{supplier.name}</span> por{' '}
                  <span className="font-mono font-semibold">{formatPrice(finalTotal)}</span>{' '}
                  {paymentMode === 'CREDIT'
                    ? <>al <span className="font-semibold text-amber-700">crédito</span>. Se sumará a la deuda con el proveedor.</>
                    : <>al <span className="font-semibold text-emerald-700">contado</span>. No genera cuenta por pagar.</>}
                </p>
              </div>
            )}

            {error && (
              <p className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-600 ring-1 ring-red-100">
                <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />{error}
              </p>
            )}
          </div>

          <div className="flex flex-shrink-0 justify-end gap-2 border-t border-gray-100 px-6 py-4">
            <button type="button" onClick={handleClose}
              className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100">
              Cancelar
            </button>
            <button type="submit" disabled={createReceipt.isPending}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-600/30 hover:bg-emerald-700 disabled:opacity-60">
              {createReceipt.isPending && <Loader2 size={14} className="animate-spin" />}
              {createReceipt.isPending ? 'Registrando...' : 'Registrar recepción'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
