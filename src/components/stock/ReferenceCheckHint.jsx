import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'
import { formatPrice } from '../../utils/formatMoney'
import { useT, dateLocale } from '../../i18n'

function shortDate(str) {
  if (!str) return ''
  return new Intl.DateTimeFormat(dateLocale(), { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(str))
}

/**
 * Aviso en vivo debajo del campo «Referencia (factura / guía)»: la factura es
 * unívoca por proveedor (pedido de William — dos recepciones distintas
 * quedaron con la misma). Rojo = mismo proveedor (el BE la rechaza);
 * ámbar = existe para otro proveedor (se avisa, se permite).
 *
 * Props: { result, checking } de useReferenceCheck + supplierName.
 */
export default function ReferenceCheckHint({ result, checking, supplierName }) {
  const t = useT()
  if (checking) {
    return (
      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-400">
        <Loader2 size={12} className="animate-spin" /> {t('Verificando el número...')}
      </p>
    )
  }
  if (!result) return null
  if (!result.exists) {
    return (
      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-600">
        <CheckCircle2 size={12} /> {t('Número libre')}
      </p>
    )
  }
  if (result.sameSupplier) {
    return (
      <div className="mt-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-100">
        <p className="flex items-center gap-1.5 font-semibold">
          <AlertTriangle size={13} /> {t('Factura repetida')}
        </p>
        <p className="mt-0.5">
          {t('Ya registraste «{ref}» de {supplier} el {date} por {amount}. Las facturas no se repiten: revisá si es la misma entrega o corregí el número.', {
            ref: result.referenceDocument, supplier: supplierName ?? result.supplierName,
            date: shortDate(result.createdAt), amount: formatPrice(result.amount),
          })}
        </p>
      </div>
    )
  }
  return (
    <p className="mt-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 ring-1 ring-amber-100">
      {t('Este número ya existe para otro proveedor ({supplier}, {date}). Podés continuar si es correcto.', {
        supplier: result.supplierName, date: shortDate(result.createdAt),
      })}
    </p>
  )
}
