import { useMemo, useState } from 'react'
import { X, Loader2, Archive, RotateCcw, Search, ChevronDown, ChevronUp, History, Package } from 'lucide-react'
import { toast } from 'sonner'
import { useDeletedProducts, useRestoreProduct } from '../../hooks/useProducts'
import { getErrorMessage } from '../../utils/handleApiError'
import { formatPrice } from '../../utils/formatMoney'
import { formatQtyWithUnit } from '../../utils/quantity'
import { formatShortDate } from '../../utils/formatDate'
import { imageSrc } from '../../utils/productImage'
import { useT } from '../../i18n'

/**
 * «Borrados»: la papelera de productos. Lista lo que el dueño borró CONSERVANDO
 * el historial (pedido de William, sep-2026): el producto ya no existe para el
 * catálogo, el POS ni los reportes, pero sus ventas y recepciones siguen ahí y
 * acá queda su copia plana (todos sus campos tal como estaban al borrarlo).
 *
 * Desde cada fila se puede abrir la ficha completa o RESTAURAR: vuelve activo,
 * con su mismo código y con stock 0 (el ajuste a cero quedó en Movimientos).
 */
export default function DeletedProductsModal({ onClose, canRestore = false, businessId }) {
  const t = useT()
  const params = businessId ? { businessId } : undefined
  const { data, isLoading } = useDeletedProducts(params)
  const restore = useRestoreProduct()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(null)          // id expandido
  const [confirming, setConfirming] = useState(null) // id a restaurar

  const rows = useMemo(() => {
    const list = data ?? []
    const needle = q.trim().toLowerCase()
    if (!needle) return list
    return list.filter((r) =>
      r.name.toLowerCase().includes(needle) || r.sku.toLowerCase().includes(needle))
  }, [data, q])

  const doRestore = async (row) => {
    try {
      await restore.mutateAsync(row.productId)
      setConfirming(null)
      toast.success(t('"{name}" volvió al catálogo con su código {sku}.', { name: row.name, sku: row.sku }), {
        description: t('Su stock está en 0: regístrale una entrada o un ajuste si tienes unidades.'),
        duration: 9000,
      })
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const fmtDateTime = (iso) => {
    if (!iso) return '—'
    const d = new Date(iso)
    return `${formatShortDate(iso.slice(0, 10))} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="flex w-full max-w-2xl max-h-[88vh] flex-col rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <Archive size={18} className="text-gray-700" />
            <div>
              <h3 className="text-base font-bold text-gray-900">{t('Productos borrados')}</h3>
              <p className="text-xs text-gray-500">{t('Borrados conservando su historial. Sus ventas y recepciones siguen intactas.')}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="border-b border-gray-100 px-6 py-3">
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('Buscar por nombre o código')}
              className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <p className="flex items-center gap-2 py-10 text-sm text-gray-500 justify-center">
              <Loader2 size={15} className="animate-spin" /> {t('Cargando…')}
            </p>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
                <Archive size={24} className="text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-700">
                {q ? t('Sin resultados para "{q}"', { q }) : t('La papelera está vacía')}
              </p>
              {!q && (
                <p className="max-w-sm text-xs text-gray-400">
                  {t('Cuando borres un producto con ventas o recepciones eligiendo "Borrar del catálogo (conserva el historial)", su copia aparece aquí.')}
                </p>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 rounded-2xl border border-gray-100">
              {rows.map((row) => {
                const s = row.snapshot || {}
                const expanded = open === row.id
                return (
                  <li key={row.id} className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      <Thumb src={s.thumbUrl} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold text-gray-900">{row.name}</p>
                          <span className="rounded-lg bg-gray-100 px-2 py-0.5 font-mono text-[11px] text-gray-600">{row.sku}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {t('Borrado el')} {fmtDateTime(row.deletedAt)}
                          {row.deletedByName && <> · {t('por')} {row.deletedByName}</>}
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px]">
                          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-700 ring-1 ring-blue-100">
                            <History size={11} className="mr-1 inline -mt-px" />
                            {row.salesCount} {row.salesCount === 1 ? t('venta') : t('ventas')} · {row.receiptsCount} {row.receiptsCount === 1 ? t('recepción') : t('recepciones')}
                          </span>
                          <span className="rounded-full bg-gray-50 px-2 py-0.5 text-gray-600 ring-1 ring-gray-100">
                            {t('Tenía')} {formatQtyWithUnit(row.stockAtDeletion, s.unit)} → 0
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setOpen(expanded ? null : row.id)}
                          className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-gray-600 hover:bg-gray-100"
                        >
                          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          {t('Ficha')}
                        </button>
                        {canRestore && (
                          confirming === row.id ? (
                            <div className="flex items-center gap-1">
                              <button type="button" onClick={() => setConfirming(null)}
                                className="rounded-lg px-2 py-1 text-[11px] font-medium text-gray-500 hover:bg-gray-100">
                                {t('No')}
                              </button>
                              <button type="button" onClick={() => doRestore(row)} disabled={restore.isPending}
                                className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
                                {restore.isPending ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                                {t('Sí, restaurar')}
                              </button>
                            </div>
                          ) : (
                            <button type="button" onClick={() => setConfirming(row.id)}
                              className="flex items-center gap-1 rounded-lg border border-emerald-200 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50">
                              <RotateCcw size={12} />
                              {t('Restaurar')}
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    {expanded && (
                      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-xl bg-gray-50/80 p-3 text-xs sm:grid-cols-3">
                        <Field label={t('Proveedor')} value={s.supplierName} />
                        <Field label={t('Marca')} value={s.brandName} />
                        <Field label={t('Categoría')} value={s.categoryName} />
                        <Field label={t('Ubicación')} value={s.locationName} />
                        <Field label={t('Unidad')} value={s.unit} />
                        <Field label={t('Presentación')} value={s.presentation} />
                        <Field label={t('Cód. proveedor')} value={s.providerCode} />
                        <Field label={t('Código de barras')} value={s.barcode} />
                        <Field label={t('P. compra')} value={s.purchasePrice != null ? formatPrice(s.purchasePrice) : null} />
                        <Field label={t('P. venta')} value={s.priceIsVariable ? t('Variable') : (s.salePrice != null ? formatPrice(s.salePrice) : null)} />
                        <Field label={t('Stock mínimo')} value={s.minStock != null ? formatQtyWithUnit(s.minStock, s.unit) : null} />
                        <Field label={t('Vence')} value={s.expirationDate ? formatShortDate(s.expirationDate) : null} />
                        <Field label={t('Creado')} value={s.createdAt ? formatShortDate(String(s.createdAt).slice(0, 10)) : null} />
                        {s.description && <Field label={t('Descripción')} value={s.description} wide />}
                        {s.attributes && Object.keys(s.attributes).length > 0 && (
                          <Field label={t('Atributos')} wide
                            value={Object.entries(s.attributes).map(([k, v]) => `${k}: ${v}`).join(' · ')} />
                        )}
                        {s.importNotes && <Field label={t('Notas de import')} value={s.importNotes} wide />}
                      </dl>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-6 py-4">
          <p className="text-[11px] text-gray-400">
            {t('Restaurar lo devuelve al catálogo con su mismo código y stock 0.')}
          </p>
          <button type="button" onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
            {t('Cerrar')}
          </button>
        </div>
      </div>
    </div>
  )
}

function Thumb({ src }) {
  const url = src ? imageSrc(src) : null
  return (
    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
      {url
        ? <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
        : <Package size={16} className="text-gray-400" />}
    </div>
  )
}

function Field({ label, value, wide = false }) {
  return (
    <div className={wide ? 'col-span-2 sm:col-span-3' : ''}>
      <dt className="text-[10px] uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className="text-gray-800">{value == null || value === '' ? '—' : value}</dd>
    </div>
  )
}
