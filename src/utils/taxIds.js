// Identificación fiscal del negocio (registro, 19-oct-2026): espejo de util/TaxIds.java del BE.
import { getDefaultCountry } from './phone'
import { t } from '../i18n'

/** RUC peruano (SUNAT): 11 dígitos, prefijo 10/15/16/17/20 y dígito verificador módulo 11. */
export function isValidPeruRuc(ruc) {
  if (!/^\d{11}$/.test(ruc ?? '')) return false
  if (!['10', '15', '16', '17', '20'].includes(ruc.slice(0, 2))) return false
  const w = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
  const sum = w.reduce((acc, x, i) => acc + Number(ruc[i]) * x, 0)
  let check = 11 - (sum % 11)
  if (check === 11) check = 1
  if (check === 10) check = 0
  return check === Number(ruc[10])
}

/** Cómo se llama el identificador fiscal en cada país (etiqueta del formulario). */
export const TAX_ID_LABEL = {
  PE: 'RUC', EC: 'RUC', AR: 'CUIT', CL: 'RUT', CO: 'NIT', BO: 'NIT', MX: 'RFC', UY: 'RUT', PY: 'RUC', ES: 'NIF',
  // Resto de LatAm (multi-país, 24-oct-2026)
  VE: 'RIF', DO: 'RNC', PA: 'RUC', NI: 'RUC', GT: 'NIT', SV: 'NIT', HN: 'RTN', CR: 'Cédula jurídica', CU: 'NIT',
  IT: 'Partita IVA', DE: 'USt-IdNr.',
}

/**
 * Etiqueta del documento fiscal en el país del negocio (RUC, NIF, NIT…) — para
 * proveedores y PDFs. Sin etiqueta conocida: «Identificación fiscal».
 */
export function taxIdLabel(country = getDefaultCountry()) {
  return TAX_ID_LABEL[country] ?? t('Identificación fiscal')
}

/** El tipo guardado en el negocio; el genérico «TAX_ID» del BE se muestra con la etiqueta del país. */
export function displayTaxIdType(type, country = getDefaultCountry()) {
  const s = (type ?? '').trim()
  return !s || s === 'TAX_ID' ? taxIdLabel(country) : s
}
