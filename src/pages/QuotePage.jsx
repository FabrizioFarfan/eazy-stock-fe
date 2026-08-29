import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText, Trash2, Printer, Package } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { useProductSearch } from '../hooks/useProducts'
import LoadMoreRow from '../components/common/LoadMoreRow'
import ConfirmLeaveModal from '../components/common/ConfirmLeaveModal'
import { useDebounce } from '../hooks/useDebounce'
import { productsApi } from '../services/endpoints/products'
import ScannerInput from '../components/ScannerInput'
import PriceInput from '../components/inputs/PriceInput'
import PriceInputModeToggle from '../components/inputs/PriceInputModeToggle'
import { formatPrice } from '../utils/formatMoney'
import { printQuote } from '../utils/printQuote'
import HelpDrawer from '../components/common/HelpDrawer'
import { useT } from '../i18n'

// ── Borrador de cotización ────────────────────────────────────────────────────
// Igual que la venta: lo que se va armando se guarda en localStorage (por
// usuario). William salía a crear un producto que faltaba y volvía a una
// cotización vacía. Sobrevive al refresh; se limpia al generar el PDF o al
// descartarla a propósito.

const quoteDraftKey = (userId) => `eazystock_quote_draft_${userId || 'anon'}`

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
  const [customerName, setCustomerName]   = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [notes, setNotes]                 = useState('')
  const [validityDays, setValidityDays]   = useState(7)
  const [pendingLeave, setPendingLeave]   = useState(false)

  // Restaurar el borrador al entrar (una sola vez, cuando ya sabemos quién es).
  const draftRestoredRef = useRef(false)
  useEffect(() => {
    if (!user?.id || draftRestoredRef.current) return
    draftRestoredRef.current = true
    const d = loadQuoteDraft(user.id)
    if (!d) return
    setItems(d.items)
    setCustomerName(d.customerName ?? '')
    setCustomerPhone(d.customerPhone ?? '')
    setNotes(d.notes ?? '')
    setValidityDays(d.validityDays ?? 7)
    toast.info(t('Se restauró tu cotización en curso ({n} producto(s))', { n: d.items.length }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  // Autosave en cada cambio; lista vacía = no hay cotización que guardar.
  useEffect(() => {
    if (!user?.id || !draftRestoredRef.current) return
    try {
      if (items.length === 0) { localStorage.removeItem(quoteDraftKey(user.id)); return }
      localStorage.setItem(quoteDraftKey(user.id), JSON.stringify({
        items, customerName, customerPhone, notes, validityDays, savedAt: Date.now(),
      }))
    } catch { /* localStorage lleno o bloqueado: el borrador es best-effort */ }
  }, [items, customerName, customerPhone, notes, validityDays, user?.id])

  const discardDraft = () => {
    try { if (user?.id) localStorage.removeItem(quoteDraftKey(user.id)) } catch { /* noop */ }
  }

  // Salir: si hay productos cargados, preguntar qué hacer con la cotización.
  const requestLeave = () => {
    if (items.length > 0) setPendingLeave(true)
    else navigate('/sales')
  }

  const total = useMemo(
    () => items.reduce((acc, it) => acc + (Number(it.qty) || 0) * (Number(it.unitPrice) || 0), 0),
    [items],
  )

  const handleGenerate = () => {
    if (items.length === 0) {
      toast.error(t('Agrega al menos un producto a la cotización'))
      return
    }
    const ok = printQuote({
      businessName: user?.businessName,
      authorName: user?.name,
      customer: { name: customerName.trim(), phone: customerPhone.trim() },
      items,
      notes: notes.trim(),
      validityDays: Number(validityDays) || 0,
    })
    if (!ok) {
      toast.error(t('Tu navegador bloqueó la ventana de impresión. Habilita las ventanas emergentes.'))
      return
    }
    // Generada: la cotización ya cumplió; se limpia para empezar la siguiente.
    discardDraft()
    setItems([])
    setCustomerName('')
    setCustomerPhone('')
    setNotes('')
    setValidityDays(7)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={requestLeave}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">{t('Volver')}</span>
          </button>
          <h2 className="text-2xl font-bold text-gray-900">{t('Nueva cotización')}</h2>
          <HelpDrawer title={t('Qué es una cotización')} autoOpenKey="eazystock_quote_help_v2">
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
              <p className="mt-1">{t('El nombre y teléfono del cliente son opcionales y salen impresos. Indica los días de validez y notas (condiciones, entrega, etc.).')}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">{t('🖨️ Imprimir o compartir')}</p>
              <p className="mt-1">{t('Al terminar puedes imprimirla o guardarla en PDF para enviársela al cliente por WhatsApp.')}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">{t('✅ Si el cliente acepta')}</p>
              <p className="mt-1">{t('Registra la venta normalmente en')} <strong>{t('"Nueva venta"')}</strong> — {t('ahí sí se descuenta el stock.')}</p>
            </div>
          </HelpDrawer>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="hidden text-[11px] text-gray-400 sm:inline">{t('Formato del precio')}</span>
          <PriceInputModeToggle />
        </div>
      </div>

      <p className="-mt-2 text-sm text-gray-500">
        {t('Arma un presupuesto para el cliente y genera un PDF para imprimir o enviar por WhatsApp / correo. No registra una venta ni descuenta stock.')}
      </p>

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
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900">{t('Datos del cliente (opcional)')}</h3>
            <div className="mt-3 space-y-3">
              <input value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                placeholder={t('Nombre del cliente')} className={inputCls} />
              <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder={t('Teléfono (opcional)')} className={inputCls} />
            </div>
          </div>

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
              disabled={items.length === 0}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
            >
              <Printer size={16} />
              {t('Generar cotización (PDF)')}
            </button>
            <p className="mt-2 flex items-center justify-center gap-1 text-center text-[11px] text-gray-400">
              <FileText size={11} /> {t('Se abre el diálogo de impresión — elige "Guardar como PDF" para enviarlo.')}
            </p>
          </div>
        </div>
      </div>

      {pendingLeave && (
        <ConfirmLeaveModal
          title={t('¿Salir de la cotización?')}
          body={t('Tienes productos cotizados. Puedes salir tranquilo: la cotización queda guardada y sigue donde la dejaste cuando vuelvas.')}
          leaveLabel={t('Salir — la cotización queda guardada')}
          stayLabel={t('Seguir con la cotización')}
          discardLabel={t('Descartar la cotización')}
          onStay={() => setPendingLeave(false)}
          onLeaveKeep={() => { setPendingLeave(false); navigate('/sales') }}
          onDiscard={() => { setPendingLeave(false); discardDraft(); setItems([]); navigate('/sales') }}
        />
      )}
    </div>
  )
}
