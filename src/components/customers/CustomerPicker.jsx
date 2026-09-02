import { formatPhoneDisplay } from '../../utils/phone'
import { useState } from 'react'
import { X, UserPlus } from 'lucide-react'
import { useDebounce } from '../../hooks/useDebounce'
import { useCustomerSearch } from '../../hooks/useCustomers'
import LoadMoreRow from '../common/LoadMoreRow'
import { formatPrice } from '../../utils/formatMoney'
import { useT } from '../../i18n'

/**
 * Buscador de clientes del catálogo (nombre, documento o teléfono) con scroll
 * infinito y atajo para registrar uno nuevo. Lo usan la venta al fiado y la
 * cotización. `showDebt` muestra el saldo a la derecha (útil al fiar).
 */
export default function CustomerPicker({ value, onSelect, onRequestCreate, showDebt = true, subtitle }) {
  const t = useT()
  const [query, setQuery] = useState('')
  const [open, setOpen]   = useState(false)
  const debounced = useDebounce(query, 350)

  const customerSearch = useCustomerSearch(debounced)
  const { items: results, isLoading } = customerSearch

  if (value) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-xl border border-blue-300 bg-blue-50 px-3 py-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-blue-900">{value.name}</p>
          <p className="truncate text-xs text-blue-700">
            {(subtitle ? subtitle(value) : [value.documentId, formatPhoneDisplay(value.phone)].filter(Boolean).join(' · ')) || t('Cliente seleccionado')}
          </p>
        </div>
        <button type="button"
          onClick={() => onSelect(null)}
          className="flex-shrink-0 rounded-lg p-1 text-blue-600 hover:bg-blue-100">
          <X size={14} />
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
        placeholder={t('Buscar cliente por nombre, documento o teléfono...')}
        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
      />
      <button
        type="button"
        onClick={() => onRequestCreate(query.trim())}
        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-blue-300 bg-blue-50/50 px-3 py-2 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-50"
      >
        <UserPlus size={13} />
        {t('Registrar nuevo cliente')}
      </button>
      {open && debounced && (
        <div className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-gray-100 bg-white shadow-xl">
          {isLoading ? (
            <p className="px-4 py-3 text-sm text-gray-400">{t('Buscando...')}</p>
          ) : results.length === 0 ? (
            <button type="button"
              onClick={() => onRequestCreate(query.trim())}
              className="flex w-full items-center gap-2 rounded-xl px-4 py-3 text-left text-sm text-blue-700 hover:bg-blue-50">
              <UserPlus size={14} />
              <span>{t('Sin resultados — registrar')} <strong>{debounced}</strong> {t('como nuevo cliente')}</span>
            </button>
          ) : (
            <>
              {results.map((c) => (
                <button key={c.id} type="button"
                  onClick={() => { onSelect(c); setQuery(''); setOpen(false) }}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-blue-50 first:rounded-t-xl last:rounded-b-xl transition-colors">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-900">{c.name}</p>
                    <p className="truncate text-xs text-gray-400">{[c.documentId, formatPhoneDisplay(c.phone), c.email].filter(Boolean).join(' · ')}</p>
                  </div>
                  {showDebt && (
                    <span className="ml-2 flex-shrink-0 text-xs font-mono text-gray-500">
                      {formatPrice(c.currentDebt)}
                    </span>
                  )}
                </button>
              ))}
              <LoadMoreRow search={customerSearch} />
            </>
          )}
        </div>
      )}
    </div>
  )
}
