import { useEffect, useMemo, useState } from 'react'
import { X, Trash2, Plus, Search, Printer, Undo2, FileText, Loader2 } from 'lucide-react'
import { useProducts } from '../../hooks/useProducts'
import { useDebounce } from '../../hooks/useDebounce'
import { printSupplierOrder } from '../../utils/printSupplierOrder'
import { useT } from '../../i18n'

/**
 * Previsual EDITABLE de la orden de pedido antes de generar el PDF (pedido de
 * William): quitar productos que no quiere pedir, cambiar la cantidad (por
 * defecto el déficit contra el stock mínimo) y agregar productos que NO están
 * en stock bajo. Lo que se ve aquí es exactamente lo que sale en el PDF: sin
 * stock actual, sin mínimos, sin precios — solo lo que el proveedor necesita.
 *
 * @param {object}   p
 * @param {object}   p.supplier   { id, name, contact, phone, ruc }
 * @param {Array}    p.items      [{ productId, productName, providerCode, brand, qty, unit }]
 * @param {object}   p.user       { businessName, name }
 * @param {string}   [p.businessId]
 * @param {Function} p.onClose
 */
export default function SupplierOrderModal({ supplier, items: initialItems, user, businessId, onClose }) {
  const t = useT()
  const [rows, setRows]       = useState(() => initialItems.map((it) => ({ ...it, qty: Math.max(1, Number(it.qty) || 1) })))
  const [removed, setRemoved] = useState([])
  const [notes, setNotes]     = useState('')
  const [search, setSearch]   = useState('')
  const [onlySupplier, setOnlySupplier] = useState(true)
  const debounced = useDebounce(search, 300)

  const { data: found, isFetching } = useProducts(
    {
      search: debounced, size: 8, active: true,
      ...(onlySupplier && supplier?.id && { supplierId: supplier.id }),
      ...(businessId && { businessId }),
    },
    { enabled: debounced.trim().length >= 2 },
  )
  const inOrder = useMemo(() => new Set(rows.map((r) => r.productId)), [rows])
  const candidates = (found?.content ?? []).filter((p) => !inOrder.has(p.id))

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const setQty = (productId, value) => {
    setRows((rs) => rs.map((r) => (r.productId === productId ? { ...r, qty: value } : r)))
  }
  const remove = (row) => {
    setRows((rs) => rs.filter((r) => r.productId !== row.productId))
    setRemoved((rm) => [...rm, row])
  }
  const restore = (row) => {
    setRemoved((rm) => rm.filter((r) => r.productId !== row.productId))
    setRows((rs) => [...rs, row])
  }
  const add = (p) => {
    const deficit = Math.max(0, Number(p.minStock ?? 0) - Number(p.currentStock ?? 0))
    setRows((rs) => [...rs, {
      productId:    p.id,
      productName:  p.name,
      providerCode: p.providerCode,
      brand:        p.brandName,
      unit:         p.unit,
      qty:          deficit > 0 ? deficit : 1,
      added:        true,
    }])
    setSearch('')
  }

  const validRows = rows.filter((r) => Number(r.qty) > 0)
  const totalQty  = validRows.reduce((s, r) => s + Number(r.qty), 0)

  const generate = () => {
    if (!validRows.length) return
    const ok = printSupplierOrder({
      businessName: user?.businessName,
      authorName:   user?.name,
      supplier,
      items: validRows.map((r) => ({
        productName: r.productName, providerCode: r.providerCode, brand: r.brand,
        qty: Number(r.qty), unit: r.unit,
      })),
      notes,
    })
    if (ok) onClose()
  }

  const th = 'px-3 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400'

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="flex max-h-[96vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog" aria-modal="true"
      >
        {/* Header */}
        <div className="flex flex-shrink-0 items-start justify-between gap-3 border-b border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-50">
              <FileText size={18} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">{t('Revisa el pedido antes de generar el PDF')}</h3>
              <p className="text-xs text-gray-500">
                {t('Quita lo que no quieras pedir, ajusta cantidades o agrega productos. Así saldrá el documento.')}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600" aria-label={t('Cerrar')}>
            <X size={18} />
          </button>
        </div>

        {/* Body = hoja de papel */}
        <div className="flex-1 overflow-y-auto bg-gray-50/70 px-3 py-4 sm:px-6">
          <div className="mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
            {/* Cabecera del documento */}
            <div className="flex flex-wrap items-start justify-between gap-3 border-b-[3px] border-blue-600 pb-4">
              <div>
                <p className="text-lg font-extrabold text-gray-900">{user?.businessName || t('Mi negocio')}</p>
                <p className="text-xs text-gray-500">{t('Solicitado por')} {user?.name || '—'}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-black tracking-wide text-blue-600">{t('ORDEN DE PEDIDO')}</p>
                <p className="text-xs text-gray-500">{t('Fecha')}: <strong className="text-gray-800">{new Date().toLocaleDateString()}</strong></p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{t('Proveedor')}</p>
              <p className="text-sm font-semibold text-gray-900">{supplier?.name || '—'}</p>
              {supplier?.contact && <p className="text-xs text-gray-500">{t('Atención')}: {supplier.contact}</p>}
              {supplier?.phone   && <p className="text-xs text-gray-500">Tel: {supplier.phone}</p>}
            </div>

            {/* Tabla editable */}
            <div className="mt-5 overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className={`${th} text-center`}>#</th>
                    <th className={th}>{t('Código proveedor')}</th>
                    <th className={th}>{t('Producto')}</th>
                    <th className={th}>{t('Marca')}</th>
                    <th className={`${th} text-center`}>{t('Cantidad')}</th>
                    <th className={th}></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rows.length === 0 && (
                    <tr><td colSpan={6} className="px-3 py-8 text-center text-sm text-gray-400">{t('El pedido está vacío. Agrega productos abajo.')}</td></tr>
                  )}
                  {rows.map((r, i) => {
                    const bad = !(Number(r.qty) > 0)
                    return (
                      <tr key={r.productId} className={r.added ? 'bg-emerald-50/40' : ''}>
                        <td className="px-3 py-2 text-center text-xs text-gray-400">{i + 1}</td>
                        <td className="px-3 py-2 font-mono text-xs text-gray-600">{r.providerCode || '—'}</td>
                        <td className="px-3 py-2 font-medium text-gray-900">
                          {r.productName}
                          {r.added && <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">{t('agregado')}</span>}
                        </td>
                        <td className="px-3 py-2 text-gray-600">{r.brand || '—'}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-center gap-1.5">
                            <input
                              type="number" min={1} step="any" value={r.qty}
                              onChange={(e) => setQty(r.productId, e.target.value)}
                              className={`w-20 rounded-lg border px-2 py-1.5 text-center text-sm font-bold outline-none focus:ring-2 focus:ring-blue-600/20 ${
                                bad ? 'border-red-300 bg-red-50 text-red-700' : 'border-gray-200 text-gray-900 focus:border-blue-600'
                              }`}
                            />
                            {r.unit && <span className="text-xs text-gray-400">{r.unit}</span>}
                          </div>
                        </td>
                        <td className="px-2 py-2 text-right">
                          <button onClick={() => remove(r)} title={t('Quitar del pedido')}
                            className="rounded-lg p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-600 transition-colors">
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-right text-xs text-gray-500">
              {t('{n} producto(s) · {q} unidades en total', { n: validRows.length, q: totalQty })}
            </p>

            {/* Quitados (deshacer) */}
            {removed.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs text-gray-400">{t('Quitados')}:</span>
                {removed.map((r) => (
                  <button key={r.productId} onClick={() => restore(r)}
                    className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-600 line-through hover:bg-white hover:no-underline hover:text-gray-900">
                    <Undo2 size={11} /> {r.productName}
                  </button>
                ))}
              </div>
            )}

            {/* Agregar producto */}
            <div className="mt-5 rounded-xl border border-dashed border-blue-200 bg-blue-50/40 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-52">
                  <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder={t('Agregar otro producto al pedido (nombre o código)…')}
                    className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                  />
                  {isFetching && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />}
                </div>
                {supplier?.id && (
                  <label className="flex items-center gap-1.5 text-xs text-gray-600">
                    <input type="checkbox" checked={onlySupplier} onChange={(e) => setOnlySupplier(e.target.checked)} className="accent-blue-600" />
                    {t('Solo de este proveedor')}
                  </label>
                )}
              </div>
              {debounced.trim().length >= 2 && (
                <ul className="mt-2 divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-100 bg-white">
                  {candidates.length === 0 && !isFetching && (
                    <li className="px-3 py-2 text-xs text-gray-400">{t('Sin resultados')}</li>
                  )}
                  {candidates.map((p) => (
                    <li key={p.id}>
                      <button type="button" onClick={() => add(p)}
                        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-blue-50">
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-gray-900">{p.name}</span>
                          <span className="block text-xs text-gray-400">
                            {p.sku}{p.brandName ? ` · ${p.brandName}` : ''}{p.supplierName ? ` · ${p.supplierName}` : ''} · {t('stock')} {p.currentStock}
                          </span>
                        </span>
                        <span className="flex flex-shrink-0 items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white">
                          <Plus size={12} /> {t('Agregar')}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Notas */}
            <div className="mt-4">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{t('Notas para el proveedor (opcional)')}</label>
              <textarea
                value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                placeholder={t('Ej: entregar el jueves por la mañana, confirmar precios antes de despachar…')}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-shrink-0 flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-white px-5 py-3 sm:px-6">
          <p className="text-xs text-gray-400">{t('El PDF no muestra tu stock actual, mínimos ni precios.')}</p>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">
              {t('Cancelar')}
            </button>
            <button onClick={generate} disabled={!validRows.length}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50">
              <Printer size={15} /> {t('Generar PDF')} ({validRows.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
