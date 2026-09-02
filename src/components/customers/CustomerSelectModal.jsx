import { useEffect, useState } from 'react'
import { X, Search, UserPlus, Check, Phone, FileDigit } from 'lucide-react'
import { useDebounce } from '../../hooks/useDebounce'
import { useCustomerSearch } from '../../hooks/useCustomers'
import LoadMoreRow from '../common/LoadMoreRow'
import CustomerFormModal from './CustomerFormModal'
import { formatPrice } from '../../utils/formatMoney'
import { formatPhoneDisplay } from '../../utils/phone'
import { useT } from '../../i18n'

/**
 * Elegir el cliente de una venta al fiado (Frank + William, 2-sep-2026).
 *
 * Antes era un buscador desplegable: si el vendedor escribía el nombre «a
 * medias» no encontraba al cliente, creía que no existía y lo registraba de
 * nuevo → clientes duplicados con deudas partidas. Ahora es un modal que
 * LISTA a todos los clientes desde el primer momento (sin escribir nada),
 * con búsqueda por nombre, documento o teléfono, filtros rápidos y el botón
 * de registrar uno nuevo ahí mismo — que además avisa si ya hay alguien
 * parecido antes de crear el duplicado.
 */
const FILTERS = [
  { key: 'all',    label: 'Todos' },
  { key: 'debt',   label: 'Con deuda' },
  { key: 'credit', label: 'Con crédito' },
]

export default function CustomerSelectModal({ open, onClose, onSelect, title, showDebt = true }) {
  const t = useT()
  const [query, setQuery]   = useState('')
  const [filter, setFilter] = useState('all')
  const [creating, setCreating] = useState(null) // null | nombre inicial
  const debounced = useDebounce(query, 300)

  const search = useCustomerSearch(debounced, filter === 'debt' ? { withDebt: true } : {}, { enabled: open })
  const items = filter === 'credit'
    ? search.items.filter((c) => c.creditLimit != null && Number(c.creditLimit) > 0)
    : search.items

  // al cerrar se limpia todo, así la próxima apertura arranca con la lista completa
  const close = () => { setQuery(''); setFilter('all'); setCreating(null); onClose() }

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null

  const pick = (c) => { onSelect(c); close() }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div className="flex h-[92vh] w-full max-w-lg flex-col rounded-t-2xl bg-white shadow-xl sm:h-[80vh] sm:rounded-2xl">

        <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">{title ?? t('¿A quién le fías?')}</h3>
            <p className="text-xs text-gray-500">{t('Todos tus clientes. Busca por nombre, documento o teléfono.')}</p>
          </div>
          <button onClick={close} aria-label={t('Cerrar')} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>

        <div className="flex-shrink-0 space-y-2.5 border-b border-gray-100 px-5 py-3">
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('Nombre, DNI/RUC o teléfono...')}
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  filter === f.key ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t(f.label)}
              </button>
            ))}
            {!search.isLoading && (
              <span className="ml-auto text-xs text-gray-500">
                {filter === 'credit' ? items.length : search.total} {t('clientes')}
              </span>
            )}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {search.isLoading ? (
            <div className="space-y-3 px-5 py-4">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-gray-100" />)}
            </div>
          ) : items.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-semibold text-gray-800">
                {debounced ? t('Nadie coincide con «{q}»', { q: debounced }) : t('Todavía no hay clientes registrados')}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {debounced ? t('Prueba con menos letras o con el documento. Si de verdad es nuevo, regístralo abajo.') : t('Registra al primero con el botón de abajo.')}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {items.map((c) => {
                const limit = c.creditLimit != null ? Number(c.creditLimit) : null
                const noCredit = limit == null || limit <= 0
                const debt = Number(c.currentDebt ?? 0)
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => pick(c)}
                      className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-blue-50"
                    >
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-700">
                        {(c.name || '?').trim().slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-900">{c.name}</p>
                        <p className="flex flex-wrap items-center gap-x-3 text-xs text-gray-500">
                          {c.documentId && <span className="inline-flex items-center gap-1"><FileDigit size={11} />{c.documentId}</span>}
                          {c.phone && <span className="inline-flex items-center gap-1"><Phone size={11} />{formatPhoneDisplay(c.phone)}</span>}
                        </p>
                      </div>
                      {showDebt && (
                        <div className="flex-shrink-0 text-right">
                          {noCredit ? (
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">{t('Sin crédito')}</span>
                          ) : (
                            <>
                              <p className={`font-mono text-xs ${debt > 0 ? 'text-orange-700' : 'text-gray-600'}`}>{formatPrice(debt)}</p>
                              <p className="text-[10px] text-gray-500">{t('de')} {formatPrice(limit)}</p>
                            </>
                          )}
                        </div>
                      )}
                      <Check size={16} className="flex-shrink-0 text-gray-300" />
                    </button>
                  </li>
                )
              })}
              {filter !== 'credit' && <LoadMoreRow search={search} />}
            </ul>
          )}
        </div>

        <div className="flex-shrink-0 border-t border-gray-200 px-5 py-3">
          <button
            type="button"
            onClick={() => setCreating(debounced)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <UserPlus size={15} />
            {debounced ? t('Registrar a «{q}» como cliente nuevo', { q: debounced }) : t('Registrar cliente nuevo')}
          </button>
          <p className="mt-1.5 text-center text-[11px] text-gray-500">{t('Antes de crearlo te avisamos si ya existe alguien parecido.')}</p>
        </div>
      </div>

      {creating !== null && (
        <CustomerFormModal
          initialName={creating}
          onClose={() => setCreating(null)}
          onCreated={(c) => { setCreating(null); pick(c) }}
          onPickExisting={(c) => { setCreating(null); pick(c) }}
        />
      )}
    </div>
  )
}
