import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, FileText, Trash2, Package, CheckCircle2, X, PencilLine, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { useProductSearch } from '../hooks/useProducts'
import { useCreateQuote, useUpdateQuote, useQuote } from '../hooks/useQuotes'
import LoadMoreRow from '../components/common/LoadMoreRow'
import ConfirmLeaveModal from '../components/common/ConfirmLeaveModal'
import QuoteTabs from '../components/common/QuoteTabs'
import { useDebounce } from '../hooks/useDebounce'
import { productsApi } from '../services/endpoints/products'
import ScannerInput from '../components/ScannerInput'
import PriceInput from '../components/inputs/PriceInput'
import PriceInputModeToggle from '../components/inputs/PriceInputModeToggle'
import { formatPrice } from '../utils/formatMoney'
import { quoteNumberLabel } from '../utils/quotePdf'
import QuoteActions from '../components/quotes/QuoteActions'
import QuoteCustomerSection from '../components/quotes/QuoteCustomerSection'
import HelpDrawer from '../components/common/HelpDrawer'
import { useT } from '../i18n'
import { formatQty } from '../utils/quantity'

// ── Borrador de cotización ────────────────────────────────────────────────────
// Igual que la venta: lo que se va armando se guarda en localStorage (por
// usuario). William salía a crear un producto que faltaba y volvía a una
// cotización vacía. Sobrevive al refresh; se limpia al generar el PDF o al
// descartarla a propósito.

import { quoteDraftKey } from '../utils/quoteDraft'

const EMPTY_CUSTOMER = { customer: null, name: '', phone: '', email: '' }

function loadQuoteDraft(userId) {
  try {
    const d = JSON.parse(localStorage.getItem(quoteDraftKey(userId)))
    return Array.isArray(d?.items) && d.items.length > 0 ? d : null
  } catch { return null }
}

const inputCls = 'w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 placeholder-gray-400'

export default function QuotePage() {
  const navigate = useNavigate()
  const t = useT()
  const { user, can } = useAuth()
  // /cotizaciones/:id/editar → misma pantalla, pero guarda con PUT y conserva el número.
  const { id: editId } = useParams()
  const editing = useQuote(editId)

  // Permiso: igual que registrar ventas (el owner puede dárselo al trabajador).
  useEffect(() => {
    if (user && !can('canRegisterSale')) navigate('/sales', { replace: true })
  }, [user, can, navigate])

  // ── Product search ──────────────────────────────────────────────────────────
  const [query, setQuery]       = useState('')
  const [showDrop, setShowDrop] = useState(false)
  const debounced = useDebounce(query, 350)
  const scanLock  = useRef(false)

  // Scroll infinito: TODOS los matches, bajando en el dropdown.
  const productSearch = useProductSearch(debounced)
  const { items: results, isLoading: loadingProds } = productSearch

  // ── Cart ─────────────────────────────────────────────────────────────────────
  const [items, setItems] = useState([]) // [{ productId, name, sku, unit, qty, unitPrice }]

  const addProduct = (p) => {
    setItems((prev) => {
      if (prev.some((x) => x.productId === p.id)) return prev
      return [...prev, {
        productId: p.id,
        name: p.name,
        sku: p.sku,
        unit: p.unit,
        qty: 1,
        unitPrice: p.priceIsVariable ? 0 : Number(p.salePrice) || 0,
      }]
    })
    setQuery('')
    setShowDrop(false)
  }

  const updateItem = (id, patch) =>
    setItems((prev) => prev.map((it) => (it.productId === id ? { ...it, ...patch } : it)))
  const removeItem = (id) =>
    setItems((prev) => prev.filter((it) => it.productId !== id))

  const handleScan = async (code) => {
    if (scanLock.current) return
    scanLock.current = true
    try {
      const product = (await productsApi.scanCode(code)).data.data
      addProduct(product)
    } catch {
      toast.error(t('No se encontró un producto con ese código'))
    } finally {
      scanLock.current = false
    }
  }

  // ── Customer + meta ────────────────────────────────────────────────────────
  const [cust, setCust]                   = useState(EMPTY_CUSTOMER)
  const [notes, setNotes]                 = useState('')
  const [validityDays, setValidityDays]   = useState(7)
  const [pendingLeave, setPendingLeave]   = useState(false)
  const [confirming, setConfirming]       = useState(false)
  const [done, setDone]                   = useState(null) // cotización guardada → modal con Descargar/WhatsApp/Correo
  const [custResetKey, setCustResetKey]   = useState(0)    // remonta la sección de cliente (limpia su buscador) al empezar otra
  const createQuote = useCreateQuote()
  const updateQuote = useUpdateQuote()
  const saving = createQuote.isPending || updateQuote.isPending

  // Modo edición: se carga la cotización y se pinta tal cual (sin tocar el borrador).
  const editLoadedRef = useRef(null)
  useEffect(() => {
    if (!editId || !editing.data || editLoadedRef.current === editId) return
    editLoadedRef.current = editId
    const q = editing.data
    if (q.status !== 'OPEN') {
      toast.error(t('Una cotización vendida no se puede editar. Usa «Duplicar» para re-cotizarla.'))
      navigate('/cotizaciones/historial', { replace: true })
      return
    }
    setItems(q.items.map((it) => ({ productId: it.productId, name: it.productName, sku: it.productSku, unit: it.unit, qty: Number(it.quantity), unitPrice: Number(it.unitPrice) })))
    setCust({
      customer: q.customerId ? { id: q.customerId, name: q.customerName, phone: q.customerPhone, email: q.customerEmail } : null,
      name: q.customerName ?? '', phone: q.customerPhone ?? '', email: q.customerEmail ?? '',
    })
    setNotes(q.notes ?? '')
    setValidityDays(q.validityDays ?? 7)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId, editing.data])

  // Restaurar el borrador al entrar (una sola vez, cuando ya sabemos quién es).
  const draftRestoredRef = useRef(false)
  useEffect(() => {
    if (!user?.id || draftRestoredRef.current || editId) return
    draftRestoredRef.current = true
    const d = loadQuoteDraft(user.id)
    if (!d) return
    setItems(d.items)
    setCust({ customer: d.customer ?? null, name: d.customerName ?? '', phone: d.customerPhone ?? '', email: d.customerEmail ?? '' })
    setNotes(d.notes ?? '')
    setValidityDays(d.validityDays ?? 7)
    if (d.duplicatedFrom) {
      toast.info(t('Copia de la cotización {n} lista para ajustar: los precios son los de hoy', { n: quoteNumberLabel(d.duplicatedFrom) }))
    } else {
      toast.info(t('Se restauró tu cotización en curso ({n} producto(s))', { n: d.items.length }))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, editId])

  // Autosave en cada cambio; lista vacía = no hay cotización que guardar.
  useEffect(() => {
    if (!user?.id || !draftRestoredRef.current || editId) return
    try {
      if (items.length === 0) { localStorage.removeItem(quoteDraftKey(user.id)); return }
      localStorage.setItem(quoteDraftKey(user.id), JSON.stringify({
        items, customer: cust.customer, customerName: cust.name, customerPhone: cust.phone, customerEmail: cust.email,
        notes, validityDays, savedAt: Date.now(),
      }))
    } catch { /* localStorage lleno o bloqueado: el borrador es best-effort */ }
  }, [items, cust, notes, validityDays, user?.id, editId])

  const discardDraft = () => {
    try { if (user?.id) localStorage.removeItem(quoteDraftKey(user.id)) } catch { /* noop */ }
  }

  // Salir: si hay productos cargados, preguntar qué hacer con la cotización.
  const requestLeave = () => {
    if (editId) { navigate('/cotizaciones/historial'); return }
    if (items.length > 0) setPendingLeave(true)
    else navigate('/sales')
  }

  const total = useMemo(
    () => items.reduce((acc, it) => acc + (Number(it.qty) || 0) * (Number(it.unitPrice) || 0), 0),
    [items],
  )

  const customerData = () => ({ name: cust.name.trim(), phone: cust.phone.trim(), email: cust.email.trim() })

  // Paso 1: validar y mostrar el resumen (Frank generó una de 2 productos creyendo que eran 3).
  const handleGenerate = () => {
    if (items.length === 0) {
      toast.error(t('Agrega al menos un producto a la cotización'))
      return
    }
    if (items.some((it) => !(Number(it.qty) > 0))) {
      toast.error(t('Hay líneas con cantidad 0 — corrígelas o quítalas'))
      return
    }
    setConfirming(true)
  }

  // Paso 2: guardar (POST o PUT) y abrir el modal de salida con Descargar/WhatsApp/Correo/Imprimir.
  const confirmGenerate = async () => {
    const c = customerData()
    const body = {
      items: items.map((it) => ({ productId: it.productId, quantity: Number(it.qty), unitPrice: Number(it.unitPrice) || 0 })),
      customerId: cust.customer?.id || undefined,
      customerName: c.name || undefined,
      customerPhone: c.phone || undefined,
      customerEmail: c.email || undefined,
      validityDays: Number(validityDays) || 0,
      notes: notes.trim() || undefined,
    }
    let saved
    try {
      saved = editId
        ? await updateQuote.mutateAsync({ id: editId, data: body })
        : await createQuote.mutateAsync(body)
    } catch {
      toast.error(t('No se pudo guardar la cotización. Revisa tu conexión e inténtalo de nuevo.'))
      return
    }
    setConfirming(false)
    toast.success(editId
      ? t('Cotización {n} actualizada', { n: quoteNumberLabel(saved.number) })
      : t('Cotización N.º {n} guardada en el historial', { n: saved.number }))
    setDone({
      businessName: user?.businessName,
      authorName: saved.authorName || user?.name,
      customer: { name: saved.customerName ?? '', phone: saved.customerPhone ?? '', email: saved.customerEmail ?? '' },
      items: items.map((it) => ({ ...it })),
      notes: notes.trim(),
      validityDays: Number(validityDays) || 0,
      number: saved.number,
      createdAt: saved.createdAt,
    })
    // Generada: la cotización ya cumplió; se limpia para empezar la siguiente.
    if (!editId) {
      discardDraft()
      setItems([])
      setCust(EMPTY_CUSTOMER)
      setCustResetKey((k) => k + 1)
      setNotes('')
      setValidityDays(7)
    }
  }

  const closeDone = (to) => {
    setDone(null)
    if (to) navigate(to)
    else if (editId) navigate('/cotizaciones/historial')
  }

  if (editId && (editing.isLoading || !editing.data)) {
    return <div className="flex items-center justify-center gap-2 py-24 text-sm text-gray-400"><Loader2 size={16} className="animate-spin" /> {t('Cargando...')}</div>
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <button onClick={requestLeave}
            className="flex flex-shrink-0 items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">{t('Volver')}</span>
          </button>
          <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
            {editId ? <>{t('Editar')} {quoteNumberLabel(editing.data?.number)}</> : t('Cotizaciones')}
          </h2>
          <HelpDrawer title={t('Qué es una cotización')} autoOpenKey="eazystock_quote_help_v3">
            <p><strong>{t('Un presupuesto para tu cliente')}</strong>: {t('mismos productos y precios que una venta, pero')} <strong>{t('sin descontar stock ni registrar dinero')}</strong>.</p>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">{t('🔍 Busca o escanea')}</p>
              <p className="mt-1">{t('Escribe el nombre o código del producto, o escanea su código de barras/QR con la cámara o tu lector. Cada resultado se agrega a la lista con un click.')}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">{t('💲 Cantidad y precio')}</p>
              <p className="mt-1">{t('Ajusta la cantidad y el precio de cada línea. Los productos de precio variable entran en 0: define tú el precio a cotizar. El selector «Formato del precio» cambia entre 2 decimales fijos o casillas separadas.')}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">{t('👤 Cliente y validez')}</p>
              <p className="mt-1">{t('Elige uno de tus clientes (o regístralo ahí mismo) o escribe datos sueltos. Con teléfono y correo, el envío por WhatsApp o mail ya sabe a quién ir. Indica los días de validez y notas (condiciones, entrega, etc.).')}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">{t('📤 Descargar, WhatsApp o correo')}</p>
              <p className="mt-1">{t('Al generar, verás un resumen para confirmar y luego los botones para descargar el PDF, mandarlo por WhatsApp o correo, o imprimirlo. En el celular el PDF va adjunto directo; en la computadora se descarga y se abre el chat con el mensaje listo.')}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">{t('✅ Si el cliente acepta')}</p>
              <p className="mt-1">{t('Registra la venta normalmente en')} <strong>{t('"Nueva venta"')}</strong> — {t('ahí sí se descuenta el stock.')}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">{t('🗂️ Historial')}</p>
              <p className="mt-1">{t('Cada cotización generada queda guardada con su número. En «Historial» la buscas por cliente, teléfono, número o producto, la reimprimes, o con «Vender estos productos» pasas todas sus líneas a una venta nueva sin cargarlas una por una.')}</p>
            </div>
          </HelpDrawer>
        </div>
        {!editId && <QuoteTabs active="new" onNavigate={(to) => (items.length > 0 ? setPendingLeave('history') : navigate(to))} />}
      </div>

      <div className="-mt-1 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <p className="text-sm text-gray-500">
          {editId
            ? t('Ajusta productos, cliente o notas. La cotización conserva su número y su fecha.')
            : t('Arma un presupuesto para el cliente y genera un PDF para descargar, enviar por WhatsApp / correo o imprimir. No registra una venta ni descuenta stock.')}
        </p>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-gray-400">{t('Formato del precio')}</span>
          <PriceInputModeToggle />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Left: products */}
        <div className="space-y-4 lg:col-span-2">
          {/* Search */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="relative">
              <ScannerInput
                value={query}
                onChange={(v) => { setQuery(v); setShowDrop(true) }}
                onScan={handleScan}
                placeholder={t('Buscar producto o escanear código...')}
              />
              {showDrop && debounced && (
                <div className="absolute z-20 mt-1 max-h-80 w-full overflow-y-auto rounded-xl border border-gray-100 bg-white shadow-xl">
                  {loadingProds ? (
                    <p className="px-4 py-3 text-sm text-gray-400">{t('Buscando...')}</p>
                  ) : results.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-gray-400">{t('Sin resultados')}</p>
                  ) : (
                    <>
                      {results.map((p) => (
                        <button key={p.id} type="button" onClick={() => addProduct(p)}
                          className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-blue-50 first:rounded-t-xl last:rounded-b-xl transition-colors">
                          <span className="font-semibold text-gray-900">{p.name}</span>
                          <span className="ml-2 flex items-center gap-2 flex-shrink-0">
                            <span className="font-mono text-xs text-gray-400">{p.sku}</span>
                            <span className="text-xs font-semibold text-gray-600">
                              {p.priceIsVariable ? t('Variable') : formatPrice(p.salePrice)}
                            </span>
                          </span>
                        </button>
                      ))}
                      <LoadMoreRow search={productSearch} />
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            {items.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16">
                <Package size={36} className="text-gray-200" />
                <p className="text-sm text-gray-400">{t('Busca y agrega productos para cotizar')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/60 text-xs uppercase tracking-widest text-gray-400">
                      <th className="px-4 py-3 text-left">{t('Producto')}</th>
                      <th className="px-4 py-3 text-center">{t('Cantidad')}</th>
                      <th className="px-4 py-3 text-left">{t('Precio unit.')}</th>
                      <th className="px-4 py-3 text-right">{t('Subtotal')}</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it) => (
                      <tr key={it.productId} className="border-b border-gray-50 align-top">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900">{it.name}</p>
                          {it.sku && <p className="font-mono text-xs text-gray-400">{it.sku}</p>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number" min="0" step="any"
                            value={it.qty}
                            onChange={(e) => updateItem(it.productId, { qty: e.target.value === '' ? '' : Number(e.target.value) })}
                            className="w-20 rounded-lg border border-gray-200 px-2 py-1.5 text-center text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="w-44">
                            <PriceInput
                              value={it.unitPrice === '' ? null : it.unitPrice}
                              onChange={(v) => updateItem(it.productId, { unitPrice: v ?? 0 })}
                              maxDecimals={2}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900 whitespace-nowrap">
                          {formatPrice((Number(it.qty) || 0) * (Number(it.unitPrice) || 0))}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => removeItem(it.productId)} title={t('Quitar')}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right: customer + meta + total */}
        <div className="space-y-4">
          <QuoteCustomerSection key={custResetKey} value={cust} onChange={setCust} />

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900">{t('Detalles')}</h3>
            <div className="mt-3 space-y-3">
              <label className="flex items-center justify-between gap-3 text-sm text-gray-600">
                <span>{t('Validez (días)')}</span>
                <input type="number" min="0" value={validityDays}
                  onChange={(e) => setValidityDays(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-20 rounded-lg border border-gray-200 px-2 py-1.5 text-center text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20" />
              </label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
                placeholder={t('Notas (condiciones, entrega, etc.)')} className={`${inputCls} resize-none`} />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="text-sm font-semibold text-gray-600">{t('Total')}</span>
              <span className="text-2xl font-extrabold text-gray-900">{formatPrice(total)}</span>
            </div>
            <button
              onClick={handleGenerate}
              disabled={items.length === 0 || saving}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {editId ? <PencilLine size={16} /> : <FileText size={16} />}
              {editId ? t('Guardar cambios') : t('Generar cotización')}
            </button>
            <p className="mt-2 text-center text-[11px] text-gray-400">
              {t('Primero ves un resumen para confirmar; después descargas el PDF, lo mandas por WhatsApp o correo, o lo imprimes.')}
            </p>
            {!editId && (
              <p className="mt-1 text-center text-[11px] text-gray-400">
                {t('Queda guardada en el historial: si el cliente vuelve, la encuentras y vendes esos productos de una.')}
              </p>
            )}
          </div>
        </div>
      </div>

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" onClick={() => !saving && setConfirming(false)}>
          <div className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">{editId ? t('¿Guardar los cambios?') : t('¿Generar esta cotización?')}</h3>
                <p className="mt-0.5 text-xs text-gray-500">{t('Revisa que esté todo antes de guardarla.')}</p>
              </div>
              <button onClick={() => setConfirming(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600" aria-label={t('Cerrar')}><X size={18} /></button>
            </div>
            <ul className="mt-4 max-h-56 divide-y divide-gray-50 overflow-y-auto rounded-xl border border-gray-100">
              {items.map((it) => (
                <li key={it.productId} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                  <span className="min-w-0 truncate text-gray-800">{it.name}</span>
                  <span className="flex-shrink-0 text-xs text-gray-500">{formatQty(it.qty)}{it.unit ? ` ${it.unit}` : ''} × {formatPrice(it.unitPrice)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1.5 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-gray-500">{t('Productos')}</dt><dd className="font-semibold text-gray-900">{items.length}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-gray-500">{t('Cliente')}</dt><dd className="truncate font-semibold text-gray-900">{cust.name.trim() || <span className="font-normal text-gray-400">{t('Sin nombre')}</span>}</dd></div>
              {(cust.phone.trim() || cust.email.trim()) && (
                <div className="flex justify-between gap-3"><dt className="text-gray-500">{t('Contacto')}</dt><dd className="truncate text-gray-700">{[cust.phone.trim(), cust.email.trim()].filter(Boolean).join(' · ')}</dd></div>
              )}
              <div className="flex justify-between gap-3"><dt className="text-gray-500">{t('Validez')}</dt><dd className="text-gray-700">{Number(validityDays) > 0 ? t('{n} día(s)', { n: Number(validityDays) }) : t('Sin vencimiento')}</dd></div>
              <div className="flex justify-between gap-3 border-t border-gray-100 pt-2"><dt className="font-semibold text-gray-700">{t('Total')}</dt><dd className="text-xl font-extrabold text-gray-900">{formatPrice(total)}</dd></div>
            </dl>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button onClick={() => setConfirming(false)} disabled={saving} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">{t('Volver a revisar')}</button>
              <button onClick={confirmGenerate} disabled={saving} className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50">
                {saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                {editId ? t('Guardar cambios') : t('Sí, generar')}
              </button>
            </div>
          </div>
        </div>
      )}

      {done && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" onClick={() => closeDone()}>
          <div className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-100"><CheckCircle2 size={20} className="text-green-600" /></div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-gray-900">{t('Cotización {n} lista', { n: quoteNumberLabel(done.number) })}</h3>
                <p className="mt-0.5 text-sm text-gray-500">
                  {done.customer.name || t('Sin nombre')} · {formatPrice(done.items.reduce((a, it) => a + (Number(it.qty) || 0) * (Number(it.unitPrice) || 0), 0))}
                </p>
              </div>
              <button onClick={() => closeDone()} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600" aria-label={t('Cerrar')}><X size={18} /></button>
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-gray-400">{t('¿Cómo se la mandas al cliente?')}</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <QuoteActions quote={done} primary="whatsapp" />
            </div>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button onClick={() => closeDone('/cotizaciones/historial')} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">{t('Ir al historial')}</button>
              {!editId && <button onClick={() => closeDone()} className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800">{t('Nueva cotización')}</button>}
            </div>
          </div>
        </div>
      )}

      {pendingLeave && (
        <ConfirmLeaveModal
          title={t('¿Salir de la cotización?')}
          body={t('Tienes productos cotizados. Puedes salir tranquilo: la cotización queda guardada y sigue donde la dejaste cuando vuelvas.')}
          leaveLabel={t('Salir — la cotización queda guardada')}
          stayLabel={t('Seguir con la cotización')}
          discardLabel={t('Descartar la cotización')}
          onStay={() => setPendingLeave(false)}
          onLeaveKeep={() => { const to = pendingLeave === 'history' ? '/cotizaciones/historial' : '/sales'; setPendingLeave(false); navigate(to) }}
          onDiscard={() => { const to = pendingLeave === 'history' ? '/cotizaciones/historial' : '/sales'; setPendingLeave(false); discardDraft(); setItems([]); navigate(to) }}
        />
      )}
    </div>
  )
}
