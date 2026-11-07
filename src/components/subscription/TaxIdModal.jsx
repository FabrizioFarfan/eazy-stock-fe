import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Loader2 } from 'lucide-react'
import { billingApi } from '../../services/endpoints/billing'
import { getErrorCode, getErrorMessage } from '../../utils/handleApiError'
import { checkTaxId, taxIdAlreadyRegisteredMessage, taxIdHelp, taxIdLabel } from '../../utils/taxIdText'
import { normalize as normalizeTaxId } from '../../utils/taxIds'
import { useT } from '../../i18n'

/**
 * El documento fiscal ya no se pide al registrarse (Frank, 7-nov-2026): se pide aquí, justo antes de pagar y una
 * sola vez. Al guardarlo, la pantalla de planes sigue con el pago que el dueño había elegido.
 */
export default function TaxIdModal({ countryCode, onSaved, onClose }) {
  const t = useT()
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const label = taxIdLabel(countryCode)

  const submit = async (e) => {
    e.preventDefault()
    const message = checkTaxId(countryCode, value, { requiredMessage: t('Requerido') })
    if (message) { setError(message); return }
    setSaving(true)
    setError('')
    try {
      await billingApi.setTaxId(normalizeTaxId(value))
      onSaved()
    } catch (err) {
      setError(getErrorCode(err) === 'TAX_ID_ALREADY_REGISTERED' ? taxIdAlreadyRegisteredMessage(countryCode) : getErrorMessage(err))
      setSaving(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" data-testid="tax-id-modal">
      <form onSubmit={submit} noValidate className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="text-lg font-bold text-gray-900">{t('Un último dato para activar tu plan')}</h2>
        <p className="mt-1 text-sm text-gray-500">{t('Necesitamos el {doc} de tu negocio. Solo te lo pedimos esta vez.', { doc: label })}</p>
        <label htmlFor="pay-tax-id" className="mb-1.5 mt-4 block text-sm font-medium text-gray-700">{label}</label>
        <input id="pay-tax-id" value={value} onChange={(e) => setValue(e.target.value)} autoFocus autoComplete="off" data-testid="tax-id-input"
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20" />
        <p className="mt-1 text-xs text-gray-400">{taxIdHelp(countryCode)}</p>
        {error && <p className="mt-2 text-sm text-red-600" data-testid="tax-id-error">{error}</p>}
        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            {t('Ahora no')}
          </button>
          <button type="submit" disabled={saving} data-testid="tax-id-save"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60">
            {saving && <Loader2 size={15} className="animate-spin" />} {t('Seguir al pago')}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  )
}
