import { X, Package, TrendingUp, TrendingDown, ArrowUpDown, QrCode, Tag, Truck, FolderOpen, AlertTriangle, CalendarClock, Edit, Trash2, ArrowDownToLine, SlidersHorizontal, Eye, MapPin, Maximize2, Merge, Loader2, History } from 'lucide-react'
import { imageSrc } from '../../utils/productImage'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { productsApi } from '../../services/endpoints/products'
import { useMergeProduct } from '../../hooks/useProducts'
import { formatQty } from '../../utils/quantity'
import { stockApi } from '../../services/endpoints/stock'
import { formatPrice } from '../../utils/formatMoney'
import ExpiryBadge from '../common/ExpiryBadge'
import { formatShortDate } from '../../utils/formatDate'
import { useT, dateLocale } from '../../i18n'
import { useAuth } from '../../context/AuthContext'

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat(dateLocale(), {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(dateStr))
}

function Section({ title, children }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">{title}</p>
      <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-3">{children}</div>
    </div>
  )
}

function Field({ label, value, mono, className = '' }) {
  const empty = value == null || value === ''
  return (
    <div className={`min-w-0 rounded-xl bg-white px-3 py-2 ring-1 ring-gray-100 ${className}`}>
      <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <div className={`mt-0.5 break-all text-sm font-semibold ${empty ? 'text-gray-300' : 'text-gray-800'} ${mono ? 'font-mono text-[13px]' : ''}`}>
        {empty ? '—' : value}
      </div>
    </div>
  )
}

function MovementTypeIcon({ type }) {
  if (type === 'SALE') return <TrendingDown size={13} className="text-red-400" />
  if (type === 'SUPPLIER_RETURN') return <TrendingDown size={13} className="text-rose-500" />
  if (type === 'PURCHASE_ENTRY') return <TrendingUp size={13} className="text-emerald-500" />
  if (type === 'RETURN') return <TrendingUp size={13} className="text-purple-500" />
  return <ArrowUpDown size={13} className="text-blue-400" />
}

function MovementTypeBadge({ type }) {
  const t = useT()
  if (type === 'SALE')
    return <span className="text-xs font-semibold text-red-500">{t('Venta')}</span>
  if (type === 'PURCHASE_ENTRY')
    return <span className="text-xs font-semibold text-emerald-600">{t('Entrada')}</span>
  if (type === 'RETURN')
    return <span className="text-xs font-semibold text-purple-600">{t('Devolución')}</span>
  if (type === 'SUPPLIER_RETURN')
    return <span className="text-xs font-semibold text-rose-600">{t('Devuelto a proveedor')}</span>
  return <span className="text-xs font-semibold text-blue-500">{t('Ajuste')}</span>
}

/**
 * Detalle completo del producto. Si llegan los handlers opcionales
 * (onEdit / onShowQr / onDeactivate / onReactivate / onRegisterEntry / onAdjust)
 * se muestra la barra de acciones al pie — las acciones viven acá, no en
 * columnas de la tabla. onRegisterEntry/onAdjust los usa la página Stock para
 * abrir el MovementModal ya prefijado con este producto.
 */
export default function ProductDetailModal({ product, onClose, hideHistoryLink = false, onEdit, onShowQr, onDeactivate, onReactivate, onRegisterEntry, onAdjust, onMerged }) {
  const t = useT()
  const navigate = useNavigate()
  // (16-sep) esto vivía dentro de MovementTypeBadge desde el 15-sep y la ficha
  // reventaba con «hidesCost is not defined» para todos, dueño incluido
  const { user } = useAuth()
  const hidesCost = user?.role === 'EMPLOYEE'
  const { data: movementsData, isLoading: loadingMov } = useQuery({
    queryKey: ['stock-movements', 'product', product.id],
    queryFn: () => stockApi.getMovementsByProduct(product.id, { size: 5 })
      .then((r) => r.data.data),
    enabled: !!product.id,
  })
  const movements = movementsData?.content ?? []

  const attrs = product.attributes ?? {}
  const hasAttrs = Object.keys(attrs).length > 0

  const isLow = product.currentStock < product.minStock
  const photo = imageSrc(product.imageUrl)
  const margin = !hidesCost && !product.priceIsVariable && product.purchasePrice && product.salePrice
    ? (((product.salePrice - product.purchasePrice) / product.purchasePrice) * 100).toFixed(1)
    : null
  const minN = Number(product.minStock ?? 0)
  const curN = Number(product.currentStock ?? 0)
  const stockPct = minN > 0 ? Math.max(3, Math.min(100, (curN / minN) * 100)) : 100
  const hasActions = !!(onEdit || onShowQr || onDeactivate || onReactivate || onRegisterEntry || onAdjust)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4" onMouseDown={onClose}>
      <div className="flex max-h-[92dvh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-2xl md:max-w-4xl lg:max-w-5xl"
        onMouseDown={(e) => e.stopPropagation()} data-testid="product-detail">

        {/* Cabecera: nombre grande + etiquetas */}
        <div className="flex flex-shrink-0 items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <p className="font-mono text-xs text-gray-400">{product.sku}</p>
            <h3 className="mt-0.5 break-words text-xl font-extrabold leading-tight text-gray-900 sm:text-2xl">{product.name}</h3>
            {product.presentation && <p className="mt-0.5 text-sm text-gray-500">{product.presentation}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
                product.active ? 'bg-emerald-50 text-emerald-700 ring-emerald-100' : 'bg-gray-100 text-gray-500 ring-gray-200'}`}>
                {product.active ? t('Activo') : t('Inactivo')}
              </span>
              {product.categoryName && (
                <span className="flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                  <FolderOpen size={11} /> {product.categoryName}
                </span>
              )}
              {product.brandName && (
                <span className="flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                  <Tag size={11} /> {product.brandName}
                </span>
              )}
              {product.supplierName && (
                <span className="flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">
                  <Truck size={11} /> {product.supplierName}
                </span>
              )}
              {product.locationName && (
                <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-100">
                  <MapPin size={11} /> {product.locationName}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} aria-label={t('Cerrar')}
            className="flex-shrink-0 rounded-xl p-2 text-gray-400 hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Cuerpo: en PC/tablet foto + cifras a la izquierda, datos a la derecha */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 gap-5 p-5 sm:p-6 md:grid-cols-5">

            {/* Columna izquierda */}
            <div className="flex flex-col gap-4 md:col-span-2">
              {/* Foto grande — solo acá se pide la versión grande (las listas usan la miniatura) */}
              {photo ? (
                <a href={photo} target="_blank" rel="noreferrer" title={t('Ver foto en grande')}
                  className="group relative block aspect-[4/3] overflow-hidden rounded-2xl md:aspect-square border border-gray-100 bg-gray-50">
                  <img src={photo} alt={product.name} className="h-full w-full object-contain" />
                  <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-lg bg-black/55 px-2 py-1 text-[11px] font-medium text-white opacity-0 transition group-hover:opacity-100">
                    <Maximize2 size={11} /> {t('Ver foto en grande')}
                  </span>
                </a>
              ) : (
                <div className="hidden aspect-square flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-200 bg-gray-50 text-gray-300 md:flex">
                  <Package size={64} strokeWidth={1.5} />
                  <p className="text-xs font-medium text-gray-400">{t('Sin foto')}</p>
                </div>
              )}

              {/* Cifras que importan en el mostrador */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-blue-600 p-4 text-white shadow-md shadow-blue-600/25">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-white/75">{t('P. venta')}</p>
                  {product.priceIsVariable ? (
                    <p className="mt-1 text-lg font-extrabold">{t('Variable')}</p>
                  ) : (
                    <p className="mt-1 whitespace-nowrap text-2xl font-extrabold leading-tight md:text-xl lg:text-2xl">{formatPrice(product.salePrice)}</p>
                  )}
                  <p className="text-[11px] text-white/75">{t('por')} {product.unit || t('unidad')}</p>
                </div>
                <div className={`rounded-2xl border p-4 ${isLow ? 'border-red-100 bg-red-50' : 'border-gray-100 bg-white'}`}>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{t('Stock actual')}</p>
                  <p className={`mt-1 text-2xl font-extrabold leading-tight ${isLow ? 'text-red-600' : 'text-gray-900'}`}>{formatQty(product.currentStock)}</p>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
                    <div className={`h-full rounded-full ${curN <= 0 ? 'bg-red-500' : isLow ? 'bg-orange-500' : 'bg-emerald-500'}`} style={{ width: `${stockPct}%` }} />
                  </div>
                  <p className="mt-1 text-[11px] text-gray-400">{t('Mínimo')} {formatQty(product.minStock)}</p>
                </div>
                {!hidesCost && (
                  <div className="col-span-2 flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{t('P. compra')}</p>
                      <p className="text-base font-bold text-gray-900">{formatPrice(product.purchasePrice)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{t('Margen')}</p>
                      <p className={`text-base font-bold ${margin == null ? 'text-gray-300' : Number(margin) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {margin == null ? '—' : `${margin}%`}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Columna derecha */}
            <div className="flex min-w-0 flex-col gap-4 md:col-span-3">
              {isLow && (
                <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 ring-1 ring-red-100">
                  <AlertTriangle size={15} className="flex-shrink-0" />
                  {t('Stock bajo — {n} unidades (mínimo {min})', { n: product.currentStock, min: product.minStock })}
                </div>
              )}
              {product.expired && (
                <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 ring-1 ring-red-100">
                  <CalendarClock size={15} className="flex-shrink-0" />
                  {t('Producto vencido — venció el {date}', { date: formatShortDate(product.expirationDate) })}
                </div>
              )}
              {!product.expired && product.expiringSoon && (
                <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 ring-1 ring-amber-100">
                  <CalendarClock size={15} className="flex-shrink-0" />
                  {t('Por vencer')} — {product.daysToExpire === 0 ? t('vence hoy') : t('en {n} días', { n: product.daysToExpire })} ({formatShortDate(product.expirationDate)})
                </div>
              )}

              {/* Identificación en rejilla: al costado de la foto, no debajo */}
              <Section title={t('Identificación')}>
                <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
                  <Field label={t('Código (SKU)')}     value={product.sku}          mono />
                  <Field label={t('Código de barras')} value={product.barcode}      mono />
                  <Field label={t('Código proveedor')} value={product.providerCode} mono />
                  <Field label={t('Unidad')}           value={product.unit} />
                  <Field label={t('Ubicación')}        value={product.locationName || t('Sin ubicación')} />
                  <Field label={t('Vencimiento')}      value={product.expirationDate ? <ExpiryBadge product={product} /> : t('Sin fecha')} />
                  <Field label={t('QR sistema')}       value={product.qrCodeSystem} mono className="col-span-2 lg:col-span-3" />
                </div>
              </Section>

              {(product.description || hasAttrs) && (
                <Section title={hasAttrs ? t('Atributos') : t('Descripción')}>
                  {product.description && <p className="text-sm text-gray-600">{product.description}</p>}
                  {hasAttrs && (
                    <div className={`flex flex-wrap gap-2 ${product.description ? 'mt-3' : ''}`}>
                      {Object.entries(attrs).map(([key, val]) => (
                        <span key={key} className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-1.5 text-xs">
                          <span className="text-gray-400">{key}</span>{' '}
                          <span className="font-semibold text-gray-800">{val}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </Section>
              )}

              {/* Notas de importación — si hubo issues durante el bulk import */}
              {product.importNotes && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">{t('Notas de importación')}</p>
                  <p className="mt-1 text-xs leading-relaxed text-amber-800">{product.importNotes}</p>
                </div>
              )}

              {/* Repetidos: mismo nombre con otro código. Hasta el 16-sep cada recepción
                  de otro proveedor creaba un clon (TRIZ ×2); el dueño los fusiona desde acá. */}
              {onMerged && <DuplicatesSection product={product} onMerged={onMerged} />}

              {/* Historial reciente */}
              <div>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">{t('Historial reciente')}</p>
                  {/* Pedido de William: acá solo se ven los últimos 5; el historial
                      entero vive en Stock › Movimientos, ya filtrado por este producto */}
                  {!hideHistoryLink && <button type="button"
                    onClick={() => {
                      onClose()
                      navigate(`/stock?tab=movements&product=${product.id}`, { state: { product } })
                    }}
                    className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors">
                    <History size={13} />
                    {t('Ver todo su historial')}
                  </button>}
                </div>
                {loadingMov ? (
                  <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-10 animate-pulse rounded-xl bg-gray-100" />)}</div>
                ) : movements.length === 0 ? (
                  <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-5 text-center text-xs text-gray-400">
                    {t('Sin movimientos registrados')}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50 rounded-xl border border-gray-100 bg-white">
                    {movements.map((m) => (
                      <div key={m.id} className="flex items-center gap-3 px-3 py-2.5">
                        <MovementTypeIcon type={m.type} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <MovementTypeBadge type={m.type} />
                            <span className="truncate text-xs text-gray-400">{m.notes}</span>
                          </div>
                          <p className="mt-0.5 text-xs text-gray-400">{formatDate(m.createdAt)}</p>
                        </div>
                        <span className={`shrink-0 text-sm font-bold ${
                          (m.type === 'SALE' || m.type === 'SUPPLIER_RETURN') ? 'text-red-500' : 'text-emerald-600'
                        }`}>
                          {(m.type === 'SALE' || m.type === 'SUPPLIER_RETURN') ? '-' : '+'}{m.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                <span>{t('Creado')}: {formatDate(product.createdAt)}</span>
                <span>{t('Actualizado')}: {formatDate(product.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Acciones: lo que borra a la izquierda, lo de todos los días a la derecha */}
        {hasActions && (
          <div className="flex flex-shrink-0 flex-col-reverse gap-2 rounded-b-2xl border-t border-gray-100 bg-gray-50 px-5 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-6">
            <div className="flex flex-wrap gap-2">
              {/* También para productos ya ocultos: desde acá se los borra de
                  verdad y su código vuelve a quedar libre. */}
              {onDeactivate && (
                <button onClick={() => onDeactivate(product)}
                  className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors">
                  <Trash2 size={14} />
                  {product.active ? t('Ocultar o borrar') : t('Borrar definitivamente')}
                </button>
              )}
              {onShowQr && (
                <button onClick={() => onShowQr(product)}
                  className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors">
                  <QrCode size={14} />
                  {t('Código QR')}
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2 [&>button]:flex-1 [&>button]:justify-center sm:[&>button]:flex-none">
              {onAdjust && (
                <button onClick={() => onAdjust(product)}
                  className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50 transition-colors">
                  <SlidersHorizontal size={14} />
                  {t('Ajustar stock')}
                </button>
              )}
              {onRegisterEntry && (
                <button onClick={() => onRegisterEntry(product)}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors">
                  <ArrowDownToLine size={14} />
                  {t('Registrar entrada')}
                </button>
              )}
              {/* Camino de vuelta para lo que se ocultó por error: un producto con
                  ventas no se puede borrar, así que sin esto quedaba atrapado. */}
              {onReactivate && !product.active && (
                <button onClick={() => onReactivate(product)}
                  className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors">
                  <Eye size={14} />
                  {t('Reactivar')}
                </button>
              )}
              {onEdit && (
                <button onClick={() => onEdit(product)}
                  className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors">
                  <Edit size={14} />
                  {t('Editar')}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * «Este producto está repetido»: lista los otros productos del negocio con el
 * mismo nombre y deja fusionarlos en ESTE (historial, ventas, devoluciones,
 * cotizaciones y stock pasan aquí; el otro se borra y libera su código).
 * Dos toques para confirmar, como todo lo que borra.
 */
function DuplicatesSection({ product, onMerged }) {
  const t = useT()
  const merge = useMergeProduct()
  const [armed, setArmed] = useState(null)
  const { data: dups = [] } = useQuery({
    queryKey: ['product-duplicates', product.id],
    queryFn: () => productsApi.duplicates(product.id).then((r) => r.data.data ?? []),
    enabled: !!product.id,
  })
  if (!dups.length) return null

  const doMerge = async (dup) => {
    if (armed !== dup.id) { setArmed(dup.id); setTimeout(() => setArmed((a) => (a === dup.id ? null : a)), 4000); return }
    try {
      const updated = await merge.mutateAsync({ keepId: product.id, duplicateId: dup.id })
      toast.success(t('Fusionado: «{name}» ({sku}) pasó a este producto', { name: dup.name, sku: dup.sku }))
      setArmed(null)
      onMerged?.(updated)
    } catch (e) {
      toast.error(e?.response?.data?.message ?? t('No se pudo fusionar'))
    }
  }

  return (
    <Section title={t('Producto repetido')}>
      <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3" data-testid="duplicates-section">
        <p className="text-xs text-amber-900">
          {t('Hay {n} producto(s) más con este nombre. Si físicamente es el mismo, fusiónalo aquí: su historial (ventas, recepciones, devoluciones, cotizaciones) y su stock pasan a este producto y el otro se borra; su código queda libre.', { n: dups.length })}
        </p>
        <ul className="mt-2 space-y-1.5">
          {dups.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 ring-1 ring-amber-100" data-testid="duplicate-row">
              <div className="min-w-0 text-xs">
                <span className="font-mono font-semibold text-gray-700">{d.sku}</span>
                {d.supplierName && <span className="ml-2 text-gray-500">{d.supplierName}</span>}
                <span className="ml-2 text-gray-500">· {t('stock')} {formatQty(d.currentStock)}</span>
                {!d.active && <span className="ml-2 text-gray-400">· {t('oculto')}</span>}
              </div>
              <button
                type="button"
                onClick={() => doMerge(d)}
                disabled={merge.isPending}
                data-armed={armed === d.id || undefined}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60 ${
                  armed === d.id ? 'bg-amber-600 text-white' : 'border border-amber-300 bg-white text-amber-800 hover:bg-amber-100'
                }`}
              >
                {merge.isPending && armed === d.id ? <Loader2 size={12} className="animate-spin" /> : <Merge size={12} />}
                {armed === d.id ? t('¿Seguro? Toca otra vez para fusionar') : t('Fusionar en este producto')}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  )
}
